def generate_email_body(investigation_summary, proposed_change, approve_url, reject_url, reminder_banner):

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Executive Review</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #f9f9fb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e8e8ed; border-radius: 4px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
            
            <!-- Header Accent -->
            <tr>
                <td style="height: 3px; background-color: #000000; border-top-left-radius: 4px; border-top-right-radius: 4px;"></td>
            </tr>

            <!-- Content Container -->
            <tr>
                <td style="padding: 48px 40px 40px 40px;">
                    
                    <!-- Top Eyebrow -->
                    <p style="margin: 0 0 24px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #86868b;">
                        Executive Decision Request
                    </p>

                    <!-- Section 1: Summary -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                            {reminder_banner}
                        </tr>
                        <tr>
                            <td>
                                <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #1d1d1f; border-bottom: 1px solid #f2f2f7; padding-bottom: 8px;">
                                    Investigation Summary
                                </h2>
                                <div style="font-size: 15px; line-height: 1.6; color: #3a3a3c; font-weight: 400;">
                                    {investigation_summary}
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- Section 2: Proposed Change -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
                        <tr>
                            <td style="background-color: #fafafa; border-left: 2px solid #1d1d1f; padding: 20px 24px;">
                                <h2 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6e6e73;">
                                    Proposed Action
                                </h2>
                                <div style="font-size: 15px; line-height: 1.6; color: #1d1d1f; font-weight: 500;">
                                    {proposed_change}
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- Call to Action Buttons -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #f2f2f7; padding-top: 32px;">
                        <tr>
                            <td align="left">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <!-- Primary CTA: Approve -->
                                        <td align="center" style="border-radius: 2px; background-color: #1d1d1f;">
                                            <a href="{approve_url}" target="_blank" style="font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border: 1px solid #1d1d1f;">
                                                Approve
                                            </a>
                                        </td>
                                        <td width="12"></td>
                                        <!-- Secondary CTA: Reject -->
                                        <td align="center" style="border-radius: 2px; background-color: #ffffff;">
                                            <a href="{reject_url}" target="_blank" style="font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #86868b; text-decoration: none; padding: 12px 28px; display: inline-block; border: 1px solid #e8e8ed;">
                                                Reject
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="padding: 0 40px 32px 40px; text-align: left;">
                    <p style="margin: 0; font-size: 11px; color: #a1a1a6; line-height: 1.4;">
                        This is an automated request requiring your direct authorization.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html