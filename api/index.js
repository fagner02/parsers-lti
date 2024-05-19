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
    dynReg: {
      url: process.env.url,
      name: "Tool Provider",
      logo: "https://parsers-svelte.netlify.app/favicon.png",
      description: "Tool Description",
      redirectUris: [process.env.url],
      autoActivate: true,
    },
  }
);

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
  return res.redirect("https://parsers-svelte.netlify.app/");
});

const setup = async () => {
  await lti.deploy({ port: 3000 });
};

setup();
