// import ltijs from "ltijs";
// const lti = ltijs.Provider;

// lti.setup(
//   "fOM6ZsuOmBoDT96",
//   {
//     url: "mongodb+srv://fagnerrc12:NDB4K7oFWYaiZb1n@cluster0.mm3cmlq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
//   },
//   {
//     cookies: {
//       secure: false,
//       sameSite: "",
//     },
//     // devMode: true,
//   }
// );

// // Set lti launch callback
// lti.onConnect((token: any, req: any, res: { send: (arg0: string) => any }) => {
//   console.log(token);
//   return res.send("It's alive!");
// });

// async function ltiSetup(): Promise<void> {
//   await lti.deploy({ port: 3000 });

//   await lti.registerPlatform({
//     url: "http://localhost",
//     name: "Platform Name",
//     clientId: "fOM6ZsuOmBoDT96",
//     authenticationEndpoint: "http://localhost/mod/lti/auth.php",
//     accesstokenEndpoint: "http://localhost/mod/lti/token.php",
//     authConfig: {
//       method: "JWK_SET",
//       key: "http://localhost/mod/lti/certs.php",
//     },
//   });
// }

// ltiSetup();
