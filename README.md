# What-If Analysis of ML models for Grafana

![Grafana 8.5.3](https://img.shields.io/badge/Grafana-8.5.3-orange)
[![Watch on GitHub](https://img.shields.io/github/watchers/ertis-research/whatif-panel-for-Grafana?style=social)](https://github.com/ertis-research/whatif-panel-for-Grafana/watchers)
[![Star on GitHub](https://img.shields.io/github/stars/ertis-research/whatif-panel-for-Grafana?style=social)](https://github.com/ertis-research/whatif-panel-for-Grafana/stargazers)

This Grafana panel is a powerful tool for conducting **What-If predictive analysis with Artificial Intelligence models**, with a special focus on Machine Learning. Currently, the panel is compatible with **AI/ML models that receive a list of numeric fields through an HTTP request**.

The tool enables easy loading of data into the model directly from a data source configured in Grafana. It allows direct modifications to the data or through value intervals and presents the results in a pleasant and easily interpretable manner, using interactive graphs when necessary. Additionally, it provides the capability to export and import both the data and the obtained results.

## :wrench: Installation

To compile and install the plugin, it is necessary to download the code from this repository. This can be achieved by cloning it using the following command:

```bash
git clone https://github.com/ertis-research/whatif-panel-for-Grafana.git
cd whatif-panel-for-Grafana
```
### Development mode

To add the plugin in a development environment, you need to include the folder containing the complete code inside the [Grafana designated folder for plugins](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins). Then, the following commands must be executed to install dependencies and build plugin:

```bash
yarn install
yarn dev
```

This will enable the plugin in the instance of Grafana where it has been placed, remaining in watch mode waiting for changes to be saved.

> **Warning**
> If the plugin is not available, it is possible that the Grafana instance is not configured correctly for development. This can be verified by checking the *grafana.ini* file and checking that the [*app_mode*](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#app_mode) option is set to *development*.

### Production mode

To allow the plugin to run, it needs to be signed following the [guidelines](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/) provided by Grafana. However, there is also the option to explicitly indicate that the plugin can be executed without signature. To do this, its identifier must be included in the [*allow_loading_unsigned_plugins*](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins) option of the *grafana.ini* file.

To build the plugin for a production environment, run the following command to install dependencies and build plugin:

```bash
yarn install
yarn build
```

As output, a folder called *dist* will be generated in the root of the project, which will contain the plugin build. **This folder should be placed inside the [plugins folder](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins) of the production environment.** 

Once these steps are completed, the plugin will be available for selection when adding a new panel to a dashboard.


## :rocket: Getting started

