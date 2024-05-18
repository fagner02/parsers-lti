const lti = require("ltijs").Provider;
const cors = require("cors");
process.env.client = "lU9O4tmFOF6Kc4B";
process.env.url = "http://localhost:3000";
process.env.name = "Platform Name";
process.env.authenticationEndpoint = "http://localhost/mod/lti/auth.php";
process.env.accesstokenEndpoint = "http://localhost/mod/lti/token.php";
process.env.key = "http://localhost/mod/lti/certs.php";
process.env.connection =
  "mongodb+srv://fagnerrc12:NDB4K7oFWYaiZb1n@cluster0.mm3cmlq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
process.env.port = 3000;
lti.setup(
  process.env.client,
  {
    url: process.env.connection,
  },
  {
    cors: false,
    cookies: {
      secure: false,
      sameSite: "",
    },
    devMode: true,
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
      details: { message: err.message },
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
  return res.send("It's alive!");
});

const setup = async () => {
  await lti.deploy({ port: 3000 });
};

setup();
