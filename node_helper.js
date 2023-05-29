/* Magic Mirror
 * Node Helper: MMM-octoprint
 *
 * By Ben Konsemüller
 * MIT Licensed.
 */

const Log = require("logger");
const NodeHelper = require("node_helper");
const fetch = require("fetch");
const moment = require("moment");

module.exports = NodeHelper.create({
  config: {},
  currentFile: null,
  async socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;

      if (this.fetchTimerId) {
        clearTimeout(this.fetchTimerId);
      }

      await this.fetchData();
    }
  },

  async fetchData() {
    const self = this;

    const printer_status = await this.fetchPrinterStatus();
    const job_status = await this.fetchPrinterJob();

    let thumbnail = null;
    let layer_information = null;

    if (this.config.showThumbnail) {
      thumbnail = await this.fetchThumbnail(job_status);
    }

    if (this.config.showLayerProgress) {
      layer_information = await this.fetchLayerInformation();
    }

    const eta = moment.utc(1000 * (job_status.progress.printTimeLeft)).format('HH[h] mm[m] ss[s]');

    this.sendSocketNotification("PRINTER_STATUS", { printer_status, job_status, eta, layer_information, thumbnail });

    this.fetchTimerId = setTimeout(async function () {
      await self.fetchData();
    }, this.config.updateInterval);
  },

  async fetchPrinterStatus() {
    const endpoint = this.config.endpoint + "/api/printer";

    try {
      const response = await fetch(endpoint, { headers: this.getHeaders() });
      const json = await response.json();

      return json;
    } catch (error) {
      Log.error(`${this.name} received an error: ${error}`);
      this.sendSocketNotification("HTTP_ERROR", {});

      return null;
    }
  },

  async fetchPrinterJob() {
    const endpoint = this.config.endpoint + "/api/job";

    try {
      const response = await fetch(endpoint, { headers: this.getHeaders() });
      const json = await response.json();

      return json;
    } catch (error) {
      Log.error(`${this.name} received an error: ${error}`);
      this.sendSocketNotification("HTTP_ERROR", {});

      return null;
    }
  },

  async fetchLayerInformation() {
    const endpoint = this.config.endpoint + "/plugin/DisplayLayerProgress/values";

    try {
      const response = await fetch(endpoint, { headers: this.getHeaders() });
      const json = await response.json();

      return json;
    } catch (error) {
      Log.error(`${this.name} received an error: ${error}`);
      this.sendSocketNotification("HTTP_ERROR", {});

      return null;
    }
  },

  async fetchThumbnail(job_status) {
    if (!job_status.job.file.name) {
      return;
    }

    const endpoint = this.config.endpoint + "/api/files/" + job_status.job.file.origin + "/" + job_status.job.file.name;

    try {
      const response = await fetch(endpoint, { headers: this.getHeaders() });
      const json = await response.json();

      if (!json.thumbnail) {
        json.thumbnail = "./modules/MMM-octoprint/img/no_thumbnail.png";
      } else {
        json.thumbnail = this.config.endpoint + "/" + json.thumbnail;
      }

      return json.thumbnail;
    } catch (error) {
      Log.error(`${this.name} received an error: ${error}`);
      this.sendSocketNotification("HTTP_ERROR", {});

      return null;
    }
  },

  getHeaders() {
    return {
      "Authorization": `Bearer ${this.config.apiKey}`
    };
  },
});
