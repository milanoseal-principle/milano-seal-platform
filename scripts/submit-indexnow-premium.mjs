const KEY = "5410460e878b06ab791d376db5f50aca";
const BASE_URL = (process.env.INDEXNOW_BASE_URL || "https://www.themilanoseal.com").replace(/\/$/, "");
const host = new URL(BASE_URL).host;

if (host !== "www.themilanoseal.com" && host !== "themilanoseal.com") {
  throw new Error(`Refusing IndexNow submission for non-canonical host: ${host}`);
}

const premiumCountries = ["italy", "switzerland", "germany", "france", "spain"];
const urlList = [
  `${BASE_URL}/`,
  `${BASE_URL}/services/apostille`,
  `${BASE_URL}/services/international-execution`,
  ...premiumCountries.flatMap((country) => [
    `${BASE_URL}/apostille/${country}`,
    `${BASE_URL}/professional/${country}`,
    `${BASE_URL}/countries/${country}`,
  ]),
];

const keyLocation = `${BASE_URL}/${KEY}.txt`;
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key: KEY,
    keyLocation,
    urlList,
  }),
});

const body = await response.text();
console.log(`IndexNow status: ${response.status}`);
console.log(`Submitted URLs: ${urlList.length}`);
if (body) console.log(body);

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow submission failed with HTTP ${response.status}`);
}
