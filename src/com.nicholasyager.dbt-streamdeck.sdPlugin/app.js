/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const myAction = new Action("com.nicholasyager.dbt-streamdeck.action");

const model = new Action("com.nicholasyager.dbt-streamdeck.model");
const job = new Action("com.nicholasyager.dbt-streamdeck.job");

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

model.onDidReceiveSettings(({ context, payload }) => {
  console.log("onDidReceiveSettings", context, payload);
  MACTIONS[context].didReceiveSettings(payload?.settings);
});

job.onWillAppear(({ action, event, context, device, payload }) => {
  MACTIONS[context] = new JobMonitor(context, payload);
  $SD.getSettings(context);
  $SD.getGlobalSettings(context);
});

job.onKeyUp(({ action, context, device, event, payload }) => {
  console.log("Your key code goes here!");
  MACTIONS[context].update();
});

job.onDidReceiveSettings(({ context, payload }) => {
  console.log("onDidReceiveSettings", context, payload);
  MACTIONS[context].didReceiveSettings(payload?.settings);
});

const OK_COLOR = "#4bb873";
const ERROR_COLOR = "#dc3545";
const MAINTENANCE_COLOR = "#0d6efd";
const PENDING_COLOR = "#ffc107";
const QUEUED_COLOR = "#6c757d";

const statusMap = {
  1: QUEUED_COLOR,
  2: PENDING_COLOR,
  3: PENDING_COLOR,
  10: OK_COLOR,
  20: ERROR_COLOR,
  30: PENDING_COLOR,
};

const filterBy = (str) =>
  items.filter((item) =>
    new RegExp("^" + str.replace(/\*/g, ".*") + "$").test(item)
  );

class JobMonitor {
  constructor(context, payload) {
    this.context = context;
    this.payload = payload;
    this.size = 48; // default size of the icon is 48
    this.title = "";
    this.client = undefined;
    this.jobId = undefined;
  }

  didReceiveSettings(settings) {
    if (!settings) return;

    console.log(settings);

    this.settings = settings;

    this.jobId = settings.jobId;
    this.client = new DbtCloud(
      settings.baseUrl,
      settings.accountId,
      settings.apiKey
    );

    this.client.getJob(this.jobId).then((result) => {
      this.job = result;
      this.title = result.name;
      this.update();
    });

    // $SD.setTitle(this.context, settings.model.replace("_", "_\n"));
  }

  makeSvg(title, color, value, subtitle) {
    const scale = 3;
    const w = this.size * scale;

    const titleSize = 20;

    let textContent = title
      .match(new RegExp(".{1," + 13 + "}", "g"))
      .map(
        (substring, index) =>
          `<text text-anchor="middle" fill="#ffffff" x="${
            w / 2
          }" font-size="${titleSize}px" font-weight="bold" y="${
            (index + 1) * titleSize
          }">${substring}</text>`
      )
      .reduce((list, item) => {
        if (list.length < 3) {
          list.push(item);
        }
        return list;
      }, [])
      .reduce((content, currentValue) => content + currentValue, "");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}">
		
		<rect width="${w}" height="${w}" x="0" y="0" fill="${color}" />
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
    this.client.getRuns(this.jobId).then((results) => {
      if (results.length < 1) {
        var svg = this.makeSvg(this.title, "ERROR", "NA", "Never Run");
      } else {
        let result = results[0];
        if (result.status >= 10) {
          let value = result.last_checked_at;
          var svg = this.makeSvg(
            this.title,
            statusMap[result.status],
            result.last_checked_at.split(" ")[1].split(".")[0],
            result.last_checked_at.split(" ")[0]
          );
        } else {
          var svg = this.makeSvg(
            this.title,
            statusMap[result.status],
            result.duration,
            result.status_humanized
          );
        }
      }
      console.log(svg);
      var icon = `data:image/svg+xml;base64,${btoa(svg)}`;
      $SD.setImage(this.context, icon);
      this.timeout = setTimeout(this.update, 60000);
    });
  }
}

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

  makeSvg(title, color, value, subtitle) {
    const scale = 3;
    const w = this.size * scale;

    const titleSize = 20;

    let textContent = title
      .match(new RegExp(".{1," + 13 + "}", "g"))
      .map(
        (substring, index) =>
          `<text text-anchor="middle" fill="#ffffff" x="${
            w / 2
          }" font-size="${titleSize}px" font-weight="bold" y="${
            (index + 1) * titleSize
          }">${substring}</text>`
      )
      .reduce((list, item) => {
        if (list.length < 3) {
          list.push(item);
        }
        return list;
      }, [])
      .reduce((content, currentValue) => content + currentValue, "");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}">
		
		<rect width="${w}" height="${w}" x="0" y="0" fill="${color}" />
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
        console.log(filteredResult[0]);
        let value = `${Math.round(filteredResult[0].execution_time)}s`;
        var svg = this.makeSvg(
          this.title,
          filteredResult[0].status == "success"
            ? OK_COLOR
            : filteredResult[0].status == "skipped"
            ? QUEUED_COLOR
            : ERROR_COLOR,
          filteredResult[0].status == "skipped" ? "Skipped" : value,
          filteredResult[0].status == "success" ? "Current" : ""
        );
        console.log(svg);
        var icon = `data:image/svg+xml;base64,${btoa(svg)}`;
        $SD.setImage(this.context, icon);
        this.timeout = setTimeout(this.update, 60000);
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

  async getJob(jobId) {
    // Find the latest run

    const response = await fetch(
      `${this.baseUrl}/api/v2/accounts/${this.accountId}/jobs/${jobId}`,
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
    return content.data;
  }

  async getRuns(jobId, status) {
    // Find the latest run

    let options = {
      limit: 5,
      job_definition_id: jobId,
      order_by: "-id",
    };

    if (!!status) {
      options.status = status;
    }

    let params = new URLSearchParams(options);
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
