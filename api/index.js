const cors = require("cors");
const { MongoClient } = require("mongodb");
const lti = require("ltijs").Provider;
const dotenv = require("dotenv");
dotenv.config();
lti.setup(
  process.env.client,
  {
    url: process.env.connection,
  },
  {
    cookies: {
      secure: false,
      sameSite: "None",
    },
    devMode: false,
    dynReg: {
      url: process.env.url,
      name: "Tool Provider",
      logo: "https://parsers-svelte.netlify.app/favicon.png",
      description: "Tool Description",
      redirectUris: [process.env.url],
      autoActivate: true,
      useDeepLinking: false,
    },
  }
);

const client = new MongoClient(process.env.connection);

lti.onDynamicRegistration(async (req, res, next) => {
  try {
    if (!req.query.openid_configuration)
      return res.status(400).send({
        status: 400,
        error: "Bad Request",
        details: { message: 'Missing parameter: "openid_configuration".' },
      });

    const message = await lti.DynamicRegistration.register(
      req.query.openid_configuration,
      req.query.registration_token
    );

    // const config = await got.get(openidConfiguration).json();
    // config.
    /**@type {string}*/
    let url = req.headers.referer;
    if (url.endsWith("/")) {
      url = url.substring(0, url.length - 1);
    }
    const db = client.db("test");
    const plats = db.collection("platforms");
    const plat = await plats.findOne({ platformUrl: url });
    // await plats.deleteOne({ _id: plat._id });
    await lti.deletePlatform(plat.platformUrl, plat.clientId);

    // lti.getPlatform().then(x=>x.platformAccessToken())
    await lti.registerPlatform({
      url: plat.platformUrl,
      clientId: plat.clientId,
      name: plat.platformName,
      authenticationEndpoint: plat.authEndpoint,
      accesstokenEndpoint: plat.accesstokenEndpoint,
      authConfig: plat.authConfig,
    });
    res.setHeader("Content-type", "text/html");
    res.send(message);
  } catch (err) {
    if (err.message === "PLATFORM_ALREADY_REGISTERED")
      return res.status(403).send({
        status: 403,
        error: "Forbidden",
        details: { message: "Platform already registered." },
      });
    return res.status(500).send({
      status: 500,
      error: "Internal Server Error",
      details: { message: err },
    });
  }
});
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

lti.onConnect(async (token, req, res) => {
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
});

const setup = async () => {
  await lti.deploy({ port: 3000 });

  // await lti.registerPlatform({
  //   url: process.env.urlk,
  //   clientId: "OBbbEBPjG6wVps0",
  //   name: "moodle",
  //   authenticationEndpoint: process.env.authenticationEndpoint,
  //   accesstokenEndpoint: process.env.accesstokenEndpoint,
  //   authConfig: {
  //     method: "JWK_SET",
  //     key: process.env.key,
  //   },
  // });

  await lti.registerPlatform({
    url: "https://sandbox.moodledemo.net",
    name: "moodle",
    clientId: "XQ9dma5gh2FoVpS",
    authenticationEndpoint: "https://sandbox.moodledemo.net/mod/lti/auth.php",
    accesstokenEndpoint: "https://sandbox.moodledemo.net/mod/lti/token.php",

    authConfig: {
      method: "JWK_SET",
      key: "https://sandbox.moodledemo.net/mod/lti/certs.php",
    },
  });
};

setup();
