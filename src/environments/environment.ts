// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // apiURL: 'http://localhost:3000/v1/',
  apiURL: "https://devapi.billions.live/v1/",
  //apiURL: 'https://api.billions.live/v1/',

  //socketURL: 'http://localhost:8081/',
  socketURL: "https://devsocket.billions.live/",
  //socketURL: 'https://socket.billions.live/',
  billionsLiveUrl: "https://billions.live/",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
