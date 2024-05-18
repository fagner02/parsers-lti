// Require Provider
import { Provider as lti } from "ltijs";

// Setup provider
lti.setup(
  process.env.client, // Key used to sign cookies and tokens
  {
    // Database configuration
    url: "",
  },
  {
    // Options
    appRoute: "/",
    loginRoute: "/login", // Optionally, specify some of the reserved routes
    cookies: {
      secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: "", // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: true, // Set DevMode to false if running in a production environment with https
  }
);
lti.app.post("/grade", async (req, res) => {
  try {
    const idtoken = res.locals.token; // IdToken
    const score = req.body.grade; // User numeric score sent in the body
    // Creating Grade object
    const gradeObj = {
      userId: idtoken.user,
      scoreGiven: score,
      scoreMaximum: 100,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
    };

    // Selecting linetItem ID
    let lineItemId = idtoken.platformContext.endpoint.lineitem; // Attempting to retrieve it from idtoken
    if (!lineItemId) {
      const response = await lti.Grade.getLineItems(idtoken, {
        resourceLinkId: true,
      });
      const lineItems = response.lineItems;
      if (lineItems.length === 0) {
        // Creating line item if there is none
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

    // Sending Grade
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
// Set lti launch callback
lti.onConnect(async (token, req, res) => {
  try {
    const idtoken = res.locals.token; // IdToken
    const score = req.body.grade; // User numeric score sent in the body
    // Creating Grade object
    req.token;
    const gradeObj = {
      userId: idtoken.user,
      scoreGiven: 50,
      scoreMaximum: 100,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
    };

    // Selecting linetItem ID
    let lineItemId = idtoken.platformContext.endpoint.lineite; // Attempting to retrieve it from idtoken
    if (!lineItemId) {
      const response = await lti.Grade.getLineItems(idtoken, {
        resourceLinkId: true,
      });
      const lineItems = response.lineItems;
      if (lineItems.length === 0) {
        // Creating line item if there is none
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

    // Sending Grade
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
  return res.send("It's alive!");
});

const setup = async () => {
  // Deploy server and open connection to the database
  await lti.deploy({ port: 3000, serverless: true }); // Specifying port. Defaults to 3000

  // Register platform
  // await lti.registerPlatform({
  //   url: process.env.url,
  //   name: process.env.name,
  //   clientId: process.env.client,
  //   authenticationEndpoint: process.env.authenticationEndpoint,
  //   accesstokenEndpoint: process.env.accesstokenEndpoint,
  //   authConfig: {
  //     method: "JWK_SET",
  //     key: process.env.key,
  //   },
  // });
};

setup();
