import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, event_type, tracking_number, status, total_paid, items } = await req.json()

    // Validate required fields
    if (!order_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, event_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if Resend is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('NOTIFY_FROM_EMAIL')

    if (!resendApiKey || !fromEmail) {
      console.log('Resend not configured, skipping customer notification')
      return new Response(
        JSON.stringify({ message: 'Notification skipped: Resend not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_email, customer_name, code, payment_status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('Error fetching order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build email content based on event type
    let subject = ''
    let htmlContent = ''

    if (event_type === 'order_paid') {
      subject = `Your Flower Girl order ${order.code} is confirmed`
      const itemsList = items && items.length > 0
        ? items.map((item: any) => `<li>${item.name || item.product_name}${item.quantity > 1 ? ` x${item.quantity}` : ''}</li>`).join('')
        : '<li>Your selected items</li>'

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Order Confirmed</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Your order <strong>${order.code}</strong> has been confirmed and payment received.</p>
          <p><strong>Total Paid:</strong> GHS ${Number(total_paid || 0).toLocaleString()}</p>
          <p><strong>Tracking Number:</strong> ${tracking_number || 'Will be assigned soon'}</p>
          <h3 style="color: #1a1a1a; margin-top: 20px;">Items:</h3>
          <ul>${itemsList}</ul>
          <p style="margin-top: 20px;">You can track your order status at any time.</p>
          <p>Thank you for choosing Flower Girl!</p>
        </div>
      `
    } else if (event_type === 'status_change') {
      const statusLabels: Record<string, string> = {
        'paid': 'Paid',
        'packaging': 'Processing',
        'ready': 'Packed and Ready',
        'delivery': 'Dispatched',
        'completed': 'Delivered',
        'cancelled': 'Cancelled'
      }
      const statusLabel = statusLabels[status] || status

      subject = `Update: Your order ${order.code} is now ${statusLabel}`
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Order Status Update</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Your order <strong>${order.code}</strong> status has been updated to:</p>
          <p style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin: 20px 0;">${statusLabel}</p>
          ${tracking_number ? `<p><strong>Tracking Number:</strong> ${tracking_number}</p>` : ''}
          <p>You can continue to track your order status.</p>
          <p>Thank you for choosing Flower Girl!</p>
        </div>
      `
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid event_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: order.customer_email,
        subject,
        html: htmlContent,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend API error:', errorText)
      // Don't fail the order flow even if email fails
      return new Response(
        JSON.stringify({ message: 'Email failed but order processed', error: errorText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendData = await resendResponse.json()
    console.log('Email sent successfully:', resendData)

    return new Response(
      JSON.stringify({ message: 'Notification sent', emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('notify-customer error:', error)
    // Don't fail the order flow even if notification fails
    return new Response(
      JSON.stringify({ message: 'Notification failed but order processed', error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
