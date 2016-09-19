Manual deployment overview:
1.  Create a new "Web app" App Service.
2.  Configure the following environment variables inside your Application Settings:
    * MICROSOFT_APP_ID
    * MICROSOFT_APP_PASSWORD
    * MICROSOFT_LUIS_MODEL
3.  Configure Git integration inside Deployment Options to automatically redeploy
    bot upon code commit.
