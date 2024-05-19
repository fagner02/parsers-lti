const cors = require("cors");
const lti = require("ltijs").Provider;
// const dotenv = require("dotenv");
// dotenv.config();
lti.setup(
  process.env.client,
  {
    url: process.env.connection,
  },
  {
    cookies: {
      secure: false,
      sameSite: "",
    },
    devMode: false,
    // dynReg: {
    //   url: process.env.url,
    //   name: "Tool Provider",
    //   logo: "https://parsers-svelte.netlify.app/favicon.png",
    //   description: "Tool Description",
    //   redirectUris: [process.env.url],
    //   autoActivate: true,
    // },
  }
);

// lti.ons
lti.app.post("/grade", async (req, res) => {
  try {
    const idtoken = res.locals.token;
    const score = req.body.grade;

    const gradeObj = {
      userId: idtoken.user,
      scoreGiven: score,
      scoreMaximum: 100,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
    };

    let lineItemId = idtoken.platformContext.endpoint.lineitem;
    if (!lineItemId) {
      const response = await lti.Grade.getLineItems(idtoken, {
        resourceLinkId: true,
      });
      const lineItems = response.lineItems;
      if (lineItems.length === 0) {
        console.log("Creating new line item");
        const newLineItem = {
          scoreMaximum: 100,
          label: "Grade",
          tag: "grade",
          resourceLinkId: idtoken.platformContext.resource.id,
        };
        const lineItem = await lti.Grade.createLineItem(idtoken, newLineItem);
        lineItemId = lineItem.id;
      } else lineItemId = lineItems[0].id;
    }

    const responseGrade = await lti.Grade.submitScore(
      idtoken,
      lineItemId,
      gradeObj
    );
    return res.send(responseGrade);
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({ err: err.message });
  }
});

lti.onConnect(
  async (token, req, res) => {
    try {
      const idtoken = res.locals.token;
      const score = req.body.grade;

      const gradeObj = {
        userId: idtoken.user,
        scoreGiven: 50,
        scoreMaximum: 100,
        activityProgress: "Completed",
        gradingProgress: "FullyGraded",
      };

      const result = await lti.Grade.result(idtoken);
      // let lineItemId = idtoken.platformContext.endpoint.lineitem;
      // if (!lineItemId) {
      //   const response = await lti.Grade.getLineItems(idtoken, {
      //     resourceLinkId: true,
      //   });
      //   const lineItems = response.lineItems;
      //   if (lineItems.length === 0) {
      //     console.log("Creating new line item");
      //     const newLineItem = {
      //       scoreMaximum: 100,
      //       label: "Grade",
      //       tag: "grade",
      //       resourceLinkId: idtoken.platformContext.resource.id,
      //     };
      //     const lineItem = await lti.Grade.createLineItem(idtoken, newLineItem);
      //     lineItemId = lineItem.id;
      //   } else lineItemId = lineItems[0].id;
      // }

      // const responseGrade = await lti.Grade.submitScore(
      //   idtoken,
      //   lineItemId,
      //   gradeObj
      // );
      return res.send(result);
    } catch (err) {
      console.log(err.message);
      return res.status(500).send({ err: err.message });
    }
    return res.redirect("https://parsers-svelte.netlify.app/");
  },
  { sameSite: "None" }
);

const setup = async () => {
  await lti.deploy({ port: 3000 });

  await lti.registerPlatform({
    url: "https://sandbox.moodledemo.net",
    name: "moodle",
    clientId: "GKINIZ54E8XF57m",
    authenticationEndpoint: "https://sandbox.moodledemo.net/mod/lti/auth.php",
    accesstokenEndpoint: "https://sandbox.moodledemo.net/mod/lti/token.php",

    authConfig: {
      method: "JWK_SET",
      key: "https://sandbox.moodledemo.net/mod/lti/certs.php",
    },
  });
};

setup();
