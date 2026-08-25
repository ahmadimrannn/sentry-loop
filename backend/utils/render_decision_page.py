def render_decision_page(title: str, subtitle: str, detail_label: str, detail_value: str, status_color: str = "#1d1d1f") -> str:
    """Helper to return an executive-styled HTML response page."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title} — Sentry Loop</title>
    </head>
    <body style="margin: 0; padding: 60px 20px; background-color: #f9f9fb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1d1d1f;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e8e8ed; border-radius: 4px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
            
            <!-- Top Status Accent Bar -->
            <tr>
                <td style="height: 4px; background-color: {status_color}; border-top-left-radius: 4px; border-top-right-radius: 4px;"></td>
            </tr>

            <!-- Main Content Container -->
            <tr>
                <td style="padding: 48px 40px;">
                    
                    <!-- Eyebrow Tag -->
                    <p style="margin: 0 0 16px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #86868b;">
                        Sentry Loop &bull; System Authorization
                    </p>

                    <!-- Main Heading -->
                    <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 500; letter-spacing: -0.01em; color: #1d1d1f; line-height: 1.3;">
                        {title}
                    </h1>

                    <!-- Description -->
                    <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.6; color: #6e6e73;">
                        {subtitle}
                    </p>

                    <!-- Detail Card Block -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-left: 2px solid {status_color}; padding: 16px 20px;">
                        <tr>
                            <td>
                                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #86868b;">
                                    {detail_label}
                                </p>
                                <p style="margin: 0; font-size: 13px; font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; color: #1d1d1f; font-weight: 500;">
                                    {detail_value}
                                </p>
                            </td>
                        </tr>
                    </table>

                </td>
            </tr>

            <!-- Minimal Footer -->
            <tr>
                <td style="padding: 0 40px 32px 40px; border-top: 1px solid #f2f2f7; padding-top: 24px;">
                    <p style="margin: 0; font-size: 11px; color: #a1a1a6; text-align: left;">
                        You may safely close this window.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """