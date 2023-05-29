/* global Module */

/* Magic Mirror
 * Module: MMM-octoprint
 *
 * By Ben Konsemüller
 * MIT Licensed.
 */

Module.register("MMM-octoprint", {
  defaults: {
    endpoint: "",
    apiKey: "",
    updateInterval: 60000,
    showThumbnail: true,
    thumbnailSize: 150,
    hideDataOnStandby: true
  },

  // Store the data in an object.
  displayData: {
    printer_status: null,
    eta: null,
    thumbnails: [],
  },

  available: true,
  loading: true,

  requiresVersion: "2.1.0", // Required version of MagicMirror

  start: function () {
    Log.info(`Starting module: ${this.name}`);
    this.sendSocketNotification("CONFIG", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "PRINTER_STATUS":
        this.displayData = payload;
        this.available = true;
        this.loading = false;
        break;
      case "HTTP_ERROR":
        this.loading = false;
        this.available = false;
        break;
    }
    this.updateDom(this.config.animationSpeed);
  },

  getTemplate: function () {
    return "templates\\mmm-octoprint.njk";
  },

  getTemplateData() {
    const templateData = {
      loading: this.loading,
      config: this.config,
      printer_status: this.loading ? null : this.displayData.printer_status,
      job_status: this.loading ? null : this.displayData.job_status,
      eta: this.loading ? null : this.displayData.eta,
      thumbnail: this.loading ? null : this.displayData.thumbnail,
      layer_information: this.loading ? null : this.displayData.layer_information,
      available: this.available,
    };

    return templateData;
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return [
      "MMM-octoprint.css",
    ];
  },

  getTranslations: function () {
    return {
      en: "translations/en.json",
      de: "translations/de.json",
    };
  },
});
