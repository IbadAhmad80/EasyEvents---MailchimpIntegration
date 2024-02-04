export const composeCampaignBody = (
  emails,
  scheduleTime,
  id,
  subject = "EasyEvents.ai - Test Email",
  body = "Your plaintext content here"
) => {
  return {
    type: "plaintext",
    recipients: {
      list_id: id,
    },
    settings: {
      subject_line: subject,
      from_name: "Microtarget Marketing",
      reply_to: "ibad23ahmad@gmail.com",
      from_email: "info@microtarget.marketing",
      preview_text: "Let's get you on our schedule to review your report!",
    },
    content: {
      html: "<p>Your HTML content here</p>",
      text: body,
    },
    tracking: {
      opens: true,
      html_clicks: true,
      text_clicks: true, // Enable tracking for plain-text clicks
      goal_tracking: false,
      ecomm360: false,
      google_analytics: "",
      clicktale: "",
    },
    content_type: "template",
  };
};

const composeEmailCondition = (emails) => {
  return emails.map((email) => {
    return {
      condition_type: "TextMerge",
      field: "EMAIL",
      op: "is",
      value: email,
    };
  });
};
