/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />

$PI.onConnected((jsn) => {
  const form = document.querySelector("#property-inspector");

  const { actionInfo, appInfo, connection, messageType, port, uuid } = jsn;
  const { payload, context } = actionInfo;
  const { settings } = payload;

  console.log("Property Inspector connected", jsn);

  Utils.setFormValue(settings, form);

  form.addEventListener(
    "input",
    Utils.debounce(150, () => {
      const value = Utils.getFormValue(form);
      $PI.setSettings(value);
    })
  );

  console.log("Get global settings!");
  $PI.getGlobalSettings(context);

  //   Utils.setFormValue(settings, globalForm);

  //   form.addEventListener(
  //     "input",
  //     Utils.debounce(150, () => {
  //       const value = Utils.getFormValue(form);
  //       $PI.setSettings(value);
  //     })
  //   );
});

$PI.onDidReceiveGlobalSettings(({ payload }) => {
  console.log("onDidReceiveGlobalSettings", payload);
  const globalForm = document.querySelector("#global-settings");
  Utils.setFormValue(payload.settings, globalForm);
});

/**

/*
  Provide window level functions to use in the external window
 * (this can be removed if the external window is not used)
*/
window.sendToInspector = (data) => {
  console.log(data);
};

function handleSubmit(e) {
  let form = document.getElementById("property-inspector");
  let globalForm = document.getElementById("global-settings");

  let formdata = new FormData(form);
  let globalFormData = new FormData(globalForm);
  let settings = {
    baseUrl: globalFormData.get("baseURL"),
    accountId: globalFormData.get("accountId"),
    apiKey: globalFormData.get("apiKey"),
    project: formdata.get("project"),
    model: formdata.get("model"),
    jobId: formdata.get("jobId"),
  };

  console.log(settings);
  $PI.setSettings(settings);
  $PI.sendToPlugin(settings);
}

// function handleGlobalSubmit(e) {
//   let form = document.getElementById("global-settings");

//   console.log(form);

//   let formdata = new FormData(form);
//   let settings = {
//     baseUrl: formdata.get("baseURL"),
//     accountId: formdata.get("accountId"),
//     apiKey: formdata.get("apiKey"),
//   };
//   console.log(settings);
//   $PI.setGlobalSettings(settings);
//   $PI.setSettings(settings);
// }

function activateTabs(activeTab) {
  const allTabs = Array.from(document.querySelectorAll(".tab"));
  let activeTabEl = null;
  allTabs.forEach((el, i) => {
    el.onclick = () => clickTab(el);
    if (el.dataset?.target === activeTab) {
      activeTabEl = el;
    }
  });
  if (activeTabEl) {
    clickTab(activeTabEl);
  } else if (allTabs.length) {
    clickTab(allTabs[0]);
  }
}

function clickTab(clickedTab) {
  const allTabs = Array.from(document.querySelectorAll(".tab"));
  allTabs.forEach((el, i) => el.classList.remove("selected"));
  clickedTab.classList.add("selected");
  activeTab = clickedTab.dataset?.target;
  allTabs.forEach((el, i) => {
    if (el.dataset.target) {
      const t = document.querySelector(el.dataset.target);
      if (t) {
        t.style.display = el == clickedTab ? "block" : "none";
      }
    }
  });
}

activateTabs();
