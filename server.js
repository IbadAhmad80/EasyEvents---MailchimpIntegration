import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { URLSearchParams } from "url";
import mailchimp from "@mailchimp/mailchimp_marketing";
import { config } from "dotenv";

import { composeCampaignBody } from "./helpers.js";

config();

const app = express();

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

const MAILCHIMP_CLIENT_ID = process.env.MAILCHIMP_CLIENT_ID;
const MAILCHIMP_CLIENT_SECRET = process.env.MAILCHIMP_CLIENT_SECRET;
const OAUTH_CALLBACK = process.env.OAUTH_CALLBACK;

app.get("/oauth/mailchimp/callback", async (req, res) => {
    const {
        query: { code },
    } = req;

    const tokenResponse = await fetch("https://login.mailchimp.com/oauth2/token", {
        method: "POST",
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: MAILCHIMP_CLIENT_ID,
            client_secret: MAILCHIMP_CLIENT_SECRET,
            redirect_uri: OAUTH_CALLBACK,
            code: code,
        }),
    });

    const { access_token } = await tokenResponse.json();

    const metadataResponse = await fetch("https://login.mailchimp.com/oauth2/metadata", {
        headers: {
            Authorization: `OAuth ${access_token}`,
        },
    });

    const { dc } = await metadataResponse.json();

    res.status(200).send({ access_token, dc });
});

app.get("/audiences", async (req, res) => {
    try {
        const {
            query: { accessToken, server },
        } = req;

        mailchimp.setConfig({
            accessToken,
            server,
        });

        let audiences = [];
        const listsResponse = await mailchimp.lists.getAllLists();

        for (const list of listsResponse.lists) {
            const contacts = await mailchimp.lists.getListMembersInfo(list.id, {
                status: "subscribed",
                count: 300,
                offset: 0,
            });

            audiences.push({
                email_addresses: contacts.members.map((contact) => contact.email_address),
                list_name: list.name,
                list_id: list.id,
            });
        }

        res.status(200).send({ audiences });
    } catch (error) {
        res.status(500).send(`Error fetching contacts from lists. ${error}`);
    }
});

app.get("/campaigns", async (req, res) => {
    try {
        const { emails, scheduleTime, listId, subject, body, access_token, server } = req.query;

        mailchimp.setConfig({
            apiKey: access_token,
            server,
        });

        for (const id of JSON.parse(listId)) {
            const campaignBody = composeCampaignBody(emails, scheduleTime, id, subject, body);

            const response = await mailchimp.campaigns.create(campaignBody);
        }

        // await mailchimp.campaigns.schedule(response.id, {
        //   schedule_time: "2024-03-23T19:38:46.300Z",
        // });

        res.status(200).send({ message: `Campaign created successfully at ${scheduleTime}` });
    } catch (error) {
        console.log("error", error);
        res.status(500).send(`Error creating campaign. ${error}`);
    }
});

app.listen(80, "0.0.0.0", function () {
    console.log("Server running on port 80");
});
