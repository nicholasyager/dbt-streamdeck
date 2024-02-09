/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const myAction = new Action("com.nicholasyager.dbt-streamdeck.action");

const model = new Action("com.nicholasyager.dbt-streamdeck.model");

// Action Cache
const MACTIONS = {};

/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(
  ({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
    console.log("Stream Deck connected!");
  }
);

model.onWillAppear(({ action, event, context, device, payload }) => {
  MACTIONS[context] = new ModelOverview(context, payload);
  $SD.getSettings(context);
  $SD.getGlobalSettings(context);
});

model.onKeyUp(({ action, context, device, event, payload }) => {
  console.log("Your key code goes here!");
  MACTIONS[context].update();
});

model.onDialRotate(({ action, context, device, event, payload }) => {
  console.log("Your dial code goes here!");
});

console.log("model", model);

model.onDidReceiveSettings(({ context, payload }) => {
  console.log("onDidReceiveSettings", context, payload);
  MACTIONS[context].didReceiveSettings(payload?.settings);
});

const OK_COLOR = "#4bb873";
const ERROR_COLOR = "#dc3545";
const MAINTENANCE_COLOR = "#0d6efd";

const filterBy = (str) =>
  items.filter((item) =>
    new RegExp("^" + str.replace(/\*/g, ".*") + "$").test(item)
  );

class ModelOverview {
  constructor(context, payload) {
    this.context = context;
    this.payload = payload;
    this.size = 48; // default size of the icon is 48
    this.title = "";
    this.client = undefined;
  }

  didReceiveSettings(settings) {
    if (!settings) return;

    console.log(settings);

    this.settings = settings;
    this.title = settings.model;
    this.jobId = settings.jobId;
    this.client = new DbtCloud(
      settings.baseUrl,
      settings.accountId,
      settings.apiKey
    );

    // $SD.setTitle(this.context, settings.model.replace("_", "_\n"));
    this.update();
  }

  makeSvg(title, status, value, subtitle) {
    const scale = 3;
    const w = this.size * scale;

    const titleSize = 20;

    let textContent = title
      .split("_")
      .map(
        (substring, index) =>
          `<text text-anchor="middle" fill="#ffffff" x="${
            w / 2
          }" font-size="${titleSize}px" font-weight="bold" y="${
            (index + 1) * titleSize
          }">${index >= 1 ? "_" : ""}${substring}</text>`
      )
      .reduce((content, currentValue) => content + currentValue, "");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}">
		
		<rect width="${w}" height="${w}" x="0" y="0" fill="${
      status == "OK" ? OK_COLOR : ERROR_COLOR
    }" />
	${textContent}
		<text text-anchor="middle" fill="#ffffff" x="${w / 2}" y="${
      (2 * w) / 3
    }" font-size="32px" font-weight="bold">${value}</text>
		<text text-anchor="middle" fill="#ffffff" x="${w / 2}" y="${
      (5 * w) / 6
    }" font-size="20px" font-weight="bold">${subtitle}</text>

    </svg>`;
  }

  update() {
    this.client.getLatestRunResults(this.jobId).then((results) => {
      let filteredResult = results.results.filter((item) =>
        new RegExp(`^model\..*\.${this.title}$`).test(item.unique_id)
      );
      if (filteredResult.length < 1) {
        var svg = this.makeSvg(this.title, "ERROR", "NA", "Current");
        console.log(svg);
        var icon = `data:image/svg+xml;base64,${btoa(svg)}`;
        $SD.setImage(this.context, icon);
      } else {
        let value = `${Math.round(filteredResult[0].execution_time)}s`;
        var svg = this.makeSvg(
          this.title,
          filteredResult[0].status == "success" ? "OK" : "ERROR",
          value,
          "Current"
        );
        console.log(svg);
        var icon = `data:image/svg+xml;base64,${btoa(svg)}`;
        $SD.setImage(this.context, icon);
      }
    });
  }
}

class DbtCloud {
  constructor(baseUrl, accountId, apiKey) {
    this.baseUrl = baseUrl;
    this.accountId = accountId;
    this.apiKey = apiKey;
  }

  async getRuns(jobId) {
    // Find the latest run

    let params = new URLSearchParams({
      limit: 5,
      job_definition_id: jobId,
      order_by: "-finished_at",
      status: 10,
    });
    const response = await fetch(
      `${this.baseUrl}/api/v2/accounts/${this.accountId}/runs/?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
        },
      }
    );
    let content = await response.json().then((result) => {
      return result;
    });
    console.log(content);
    return content.data;
  }

  async getRunResults(runId) {
    const response = await fetch(
      `${this.baseUrl}/api/v2/accounts/${this.accountId}/runs/${runId}/artifacts/run_results.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
        },
      }
    );
    let content = await response.json();
    console.log(content);
    return content;
  }

  async getLatestRunResults(jobId) {
    // Get the latest run
    var runs = await this.getRuns(jobId);

    if (runs.length < 1) {
      return undefined;
    }

    var latestRun = runs[0];
    var runResults = await this.getRunResults(latestRun.id);

    return runResults;
  }
}
