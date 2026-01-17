import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BillReminderRequest {
  reminderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header to identify user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { reminderId }: BillReminderRequest = await req.json();

    // Fetch the bill reminder
    const { data: reminder, error: reminderError } = await supabase
      .from("bill_reminders")
      .select("*")
      .eq("id", reminderId)
      .eq("user_id", user.id)
      .single();

    if (reminderError || !reminder) {
      console.error("Error fetching reminder:", reminderError);
      return new Response(
        JSON.stringify({ error: "Bill reminder not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check user preferences for email notifications
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("email_notifications")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!preferences?.email_notifications) {
      return new Response(
        JSON.stringify({ message: "Email notifications are disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format currency
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(reminder.amount);

    // Format date
    const dueDate = new Date(reminder.due_date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Expense Tracker <onboarding@resend.dev>",
      to: [user.email!],
      subject: `Bill Reminder: ${reminder.title} due on ${dueDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            .amount { font-size: 32px; font-weight: bold; color: #ef4444; margin: 20px 0; }
            .detail { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .label { color: #64748b; font-size: 14px; }
            .value { font-weight: 600; font-size: 16px; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Bill Reminder</h1>
            </div>
            <div class="content">
              <h2>${reminder.title}</h2>
              <div class="amount">${formattedAmount}</div>
              
              <div class="detail">
                <div class="label">Due Date</div>
                <div class="value">📅 ${dueDate}</div>
              </div>
              
              <div class="detail">
                <div class="label">Category</div>
                <div class="value">🏷️ ${reminder.category}</div>
              </div>
              
              <div class="detail">
                <div class="label">Frequency</div>
                <div class="value">🔄 ${reminder.frequency}</div>
              </div>
              
              <p style="margin-top: 30px; color: #64748b;">
                This is a friendly reminder to pay your bill on time. 
                Don't forget to mark it as paid in your Expense Tracker!
              </p>
            </div>
            <div class="footer">
              <p>Sent from your Expense Tracker app</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update last notified timestamp
    await supabase
      .from("bill_reminders")
      .update({ last_notified_at: new Date().toISOString() })
      .eq("id", reminderId);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-bill-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
