# What-If Analysis of ML models for Grafana

![what-if-provisional](https://github.com/ertis-research/whatif-panel-for-Grafana/assets/48439828/852ab329-8012-4ad8-9c3d-1bf7bfbc8f46)

<div align="center">
  
![Grafana 8.5.3](https://img.shields.io/badge/Grafana-8.0.0-orange)
![GitHub watchers](https://img.shields.io/github/watchers/ertis-research/whatif-panel-for-Grafana)
![GitHub Repo stars](https://img.shields.io/github/stars/ertis-research/whatif-panel-for-Grafana)

</div>

This Grafana panel is a powerful tool for conducting **What-If predictive analysis with Artificial Intelligence models**, with a special focus on **Machine Learning**. Currently, the panel is compatible with **AI/ML models that receive a list of numeric fields through an HTTP request**.

The tool enables easy loading of data into the model directly from a data source configured in Grafana. It allows direct modifications to the data or through value intervals and presents the results in a pleasant and easily interpretable manner, using interactive graphs when necessary. Additionally, it provides the capability to export and import both the data and the obtained results.

Also we have made every effort to design the panel to be abstract and intuitive, while ensuring it is responsive to panel size and consistent with both dark and light modes. We hope you like it!

## :sparkles: Table of Contents

- [Installation](#wrench-installation)
  - [Requirements](#requirements)
  - [Development mode](#development-mode)
  - [Production mode](#production-mode)
- [Getting started](#rocket-getting-started)
- [Documentation](#page_facing_up-documentation)
   - [Panel usage](#panel-usage)
   - [Configuration](#configuration)

## :wrench: Installation

### Requirements

- [Node.js](https://nodejs.org/es) - version 16 or above (v18.13.0 has been used for development)
- [Yarn](https://yarnpkg.com/) - version 1 (v1.22.11 has been used for development)
- [Grafana](https://grafana.com/) - version 8 (v8.5.3 has been used for development, but higher versions will be tested soon)

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

As output, a folder called *dist* will be generated in the root of the project, which will contain the plugin build. **This folder should be placed inside the [plugins folder](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins) of the production environment** (it is recommended to rename it to the plugin identifier). 

Once these steps are completed, the plugin will be available for selection when adding a new panel to a dashboard.


## :rocket: Getting started

> **Note**
> This explanation is simplified for common users and assumes that the plugin has already been added and correctly [configured](#configuration) with the necessary AI/ML models. For more detailed information, it is recommended to consult the rest of the [documentation](#page_facing_up-documentation) provided.

The functionality of the plugin is divided into 5 steps:

#### Step 1: Select model

To begin, the AI/ML model to be used to perform the analysis must be selected. Once chosen, the tags associated with that model will be displayed in step 3. **Although the tool can apply multiple data collections, all of them will use the same model to make predictions**.

#### Step 2: Import data

Several options are provided for entering model tag data. You can select a **specific date and time**, **upload a CSV file**, or **use a variable from the Grafana dashboard** (in particular, [*from* and *to*](https://grafana.com/docs/grafana/latest/dashboards/variables/add-template-variables/#__from-and-__to)). Adding data in any of these ways will create a new collection in the drop-down menu and display the imported values in their respective tags. It is possible to add multiple collections of data (no limit set), even if they correspond to the same datetime.

#### Step 3: Modify data

At this point, it is possible to modify the values of the tags whose variation is to be analysed. To accomplish this, there are 3 options available:

- **Modify values directly:** Each tag consists of two fields: the left one shows the value obtained when importing the data, while the right one is initially empty. If the right field is filled in, the prediction will consider this as the new value of the tag. We can modify as many tags as we want in this way and **the prediction will be done jointly**, i.e. assuming the change of all of them at the same time in the same prediction.

- **Use intervals:** When a [interval](#interval-behaviour) of values has been correctly indicated, the checkbox to the right of the second field of each tag will be enabled. By ticking this box, you indicate your wish to analyse that tag with respect to the set range. It is possible to analyse more than one tag for comparison purposes. During the prediction, the values within the range will be applied, **in isolation**, to each selected tag, keeping the original value of the rest of the selected tags.

- **Merging other two options:** If modifications are made directly to some values and a interval is applied to other tags, the prediction modified by the **direct values shall be considered as the basis for the application of the interval**. This means that the modified values of the tags will be taken into account instead of the original values during the analysis of each tag with respect to the indicated interval. On the other hand, if a new value is assigned to a tag and at the same time it is selected for analysis with respect to the interval, the new value will not be taken into account in no case.

In addition, a series of [filters](#tag-filtering-and-sorting) have been enabled to facilitate the search and modification of the desired tags.

#### Step 4: Predict result

In case you have configured extra information for the selected model, this will be displayed in a section within this step after the data import, as long as you have obtained some information from the assigned query.

Once you have modified the data you want to analyse, click on the *predict all* button. This will **run the predictions for all data collections simultaneously** and display the results just below.

Results may include:

- **Original value:** This value will appear as long as there is no missing data in the original data collection. It represents the prediction for the data collection without considering any modifications.
- **New value:** This value will appear when at least one tag has a directly modified value. It represents the prediction for the data collection in which the original values are replaced by new values, in the tags where they exist. If there is any tag marked to be analysed by an interval, the corresponding original value will be considered.
- **Comparative graph:** This [graph](#graph-information) will appear when the interval is active and there is at least one tag with the box ticked for interval analysis. Each line of the graph will represent the predicted values obtained by considering, individually for each tag, the values within the range instead of their original value.

In case you want to modify the data again, you need to click on the red *Modify data again* button located where the predict button used to be. This will discard all results and allow rewriting in any of the available data collections, keeping the modifications previously indicated.

#### Step 5: Export data (optional)

This step allows you to export the information contained in the panel in order to be able to [import it](#csv-importexport) later or to perform a more exhaustive analysis with other types of tools. This button will only export data from the current data collection and not from all existing data collections.

The export button will be available from step 3 onwards, where it will be possible to download a [CSV](#csv-scheme) with the interval configuration if active, the original and new value (if any) of each tag and whether or not the tag is marked for interval analysis. After executing step 4, the result for the different predictions will be added to this information.

## :page_facing_up: Documentation

### Panel usage

#### Data collections

A data collection in the tool corresponds to a **set of original values, new values, interval data and extra information**. The tool is able to **handle more than one data collection** in order to facilitate comparison between the model output for different modifications. 

When predicting, the same model (selected in [step 1](#step-1-select-model)) shall be applied to all data collections **at the same time**. If data is missing from any of the collections, no collection will be predicted until it is resolved.

To change the active data collection, a selector is provided at the top of the tool. Switching data collections means that data from the newly selected collection will be displayed, keeping only the filter status (the interval definition is also part of the data collection).

On the other hand, data collections are identified by the origin of the data (*DateTime/CSV*) and the value entered in the import (the date or the file name).

To delete the active data collection, click on the red button with the bin icon to the right of the selector. Two buttons will appear to confirm the deletion (*Delete*) or cancel it (*Cancel*). **In case of deletion, this action cannot be undone.**

#### Tag filtering and sorting

When modifying data ([step 3](#step-3-modify-data)) the list of tags can be filtered to make it easier to find the tags whose value you want to change. There are two possible filtering modes **that overlap each other**:

- **Order and distinction by category:** In the configuration of the tags used by the model, it is possible to define a category and a priority for each tag. The distribution and order of the tags will depend on the *Show categories* switch.
  - If *enabled*, tags will be grouped by category and ordered within each group from highest to lowest priority. 
  - If *deactivated*, tags will not be grouped and will be sorted from highest to lowest priority taking into account all tags.
- **Search by text:** Just below the range definition, there is a search field where it is possible to enter text. When you do so, the tags displayed will be automatically filtered by **those whose identifier or description contains this text without distinguishing between upper and lower case**.

#### Interval behaviour

To define a range, the minimum (*min*), maximum (*max*) and *steps* fields at the top of [step 3](#step-3-modify-data) must be filled in. The minimum and maximum fields can take either positive or negative values and the minimum value must be less than or equal to the maximum value. The steps can only be positive and indicate the numerical difference to be considered within the numbers in the range, taking into account that the **extremes are always included**. 

For example, for an interval with minimum -2 and maximum 2 with steps of 1, the values -2, -1, 0, 1 and 2 shall be considered. If the division between the steps is not exact, counting shall start from the minimum and the maximum extreme shall be included. For example, for an interval with minimum -2 and maximum 3 with steps of 2, the values -2, 0, 2 and 3 shall be considered.

The values of the interval will be applied to the original value by subtracting or adding as absolute values or percentages of it, as defined with the *Type* switch (blue indicates the selected option). In particular:

- If the **percentages** (*%*) option is selected, the values shall be considered as percentages of the original value. If the percentage is negative it will be subtracted from the original value, while if it is positive it will be added.

  For example, if the interval gives -2, -1, 0, 1 and 2 and the original value of the selected tag is 10, the values 9.8, 9.9, 10, 10.1 and 10.2 will be considered. 
- If the **absolute values** option (*Abs.*) is selected, the values will be considered without taking into account the original value, subtracting if it is negative and adding if it is positive.

  For example, if the interval gives -2, -1, 0, 1 and 2 and the original value of the selected tag is 10, the values 8, 9, 10, 11 and 12 will be considered.

When the interval is well defined, **its indicator will turn from red to green** and the boxes next to the values of each tag will be enabled. At this point, **one or more tags can be selected for analysis** with respect to the interval. If after the selection of tags the interval is deconfigured, the boxes will not be disabled and those selected will not be taken into account.

#### Understanding the comparative graph

The graph appears when predicting the results ([step 4](#step-4-predict-result)) when an interval (min ≥ max) is correctly defined and at least one tag is selected for analysis. 

The X axis of the graph indicates the value subtracted or added to the original value of the tag, while the Y axis corresponds to the value returned by the prediction. The points that make up the lines are the predictions that have been made with the different values of the tag. In addition, each point not only indicates the pair (X, Y) to which it belongs but also the **specific value applied to that tag during the prediction**.

At the bottom, the legend of the graph is shown, indicating the colour of the line corresponding to each selected tag. 
- If you click *only once on one of the tags*, it will be shown or hidden from the graph. 
- If you click *twice in a row on one of the tags*, only its line will be shown on the graph, hiding all the others. Clicking again on the same tag will show all the available lines.

You can also interact with the graph through the tools provided by [Plotly](https://plotly.com/javascript/), which are displayed in the upper right corner of the graph. In order of appearance from left to right, the tools are:
- **Zoom**: By clicking somewhere on the graph and dragging the mouse, the view zooms in on the selected box.
- **Pan**: Allows you to move around the graph.
- **Box select**: Allows you to draw a box on the graph.
- **Lasso select**: Allows you to draw a custom shape on the graph.
- **Zoom in**: Zooms in on the graph.
- **Zoom out**: Zoom out the view of the graph.
- **Autoscale**: Modifies the view to show all points on the graph.
- **Reset axes**: Returns the graph to its original view.
- **Download plot as png**: Allows you to download the graph in PNG format. Clicking the button will open a new tab with the generated image. To download it, right click on the image and select *Save image as*.

#### Extra information about models

Some model information can be added in the tool to support the understanding of the prediction results. If configured, this data will be displayed under the predict button in [step 4](#step-4-predict-result) and will appear from the data import onwards (it can be consulted while modifying the tag values). This section can be minimised at any time with the arrow to the left of the title.

The information displayed will depend on the amount of information received by the query:
- If the query **does not return any data** or the extra information has not been configured correctly, the extra information section will not appear.
- If the query **returns one or two pieces of information**, these will be displayed in the section itself.
- If the query **returns more than two pieces of information**, the first two will be displayed in the section itself, while you will have to click on the *See more* button to see the rest. This will display a dialogue window with all available information. To close it you can use the *X* in the top right corner or click anywhere on the page outside the dialogue window.

#### CSV import/export

The data entered in the application and the results obtained can be exported in CSV format for further analysis with other tools or for importing into the application. This import can be useful if you want to continue an ongoing analysis or modify a previous study.

##### CSV file schema

The CSV file may start with two optional comments (preceded by #) which could be in any order. These are:
- The comment starting with **DateTime** indicates the time instant for which this data has been obtained.
- The comment starting with **Interval** indicates the interval that has been defined in the tool. It will only appear if the interval is completely set (its indicator is green).
 
After the comments, the first row marks the name of the CSV columns. The first column is ID, whose values will be used as row identifiers. Except for this and the *_RESULT* column, the rest will correspond to all the tags that enter the model, ordered in such a way that first those that have been modified with a fixed value are shown, then those that have been selected for analysis with interval, and then the rest of the tags.

On the other hand, except for the one identified with *_INTERVAL*, each row will correspond to a different prediction made to the model. The main ones are:

- **DEFAULT_VALUE**: These are the real values of the tags that enter the model. In the tool they correspond to those obtained from the Grafana query during the data import.
- **NEW_VALUE**: These are the values that have been modified directly, without using intervals.

Predictions for interval analysis are identified in the row with the tag that has been considered and the change that has been applied to its original value (e.g. *ID_TAG_1 - 2%*). All rows will show only the values used that are different from the original prediction. This will allow to easily distinguish which data has been modified from the default prediction. 

The *_INTERVAL* row marks the tags that have been selected for interval analysis (*YES* for enabled, *NO* for disabled).

Finally, the *_RESULT* column **will only appear if the data with the results are downloaded**. It will indicate the result of the prediction for the row data.

##### Export

To export the data as CSV, simply click on the download button in [step 5](#step-5-export-data-optional). This will return more or less information depending on which step the application is in.

- If the **data are being modified** ([step 3](#step-3-modify-data)), the default values imported from Grafana, the new modified values directly and the data with respect to the interval will be exported.
- If the **results have been predicted** ([step 4](#step-4-predict-result)), the same data will be exported as in the previous step, but adding the predicted values and, if available, the different predictions of the interval analysis.

##### Import

To import the CSV into the tool, select the **CSV option** in the selector of the data import section ([step 2](#step-2-import-data)). This will display an *Upload file* button which, when clicked, will display a file window where a file in CSV format can be selected. The name of the selected file will be displayed next to the button. 

By clicking on the *Add data* button the file will be processed and its data will be loaded into the tool as a new data collection. It is possible to add the same file as many times as necessary. In case of non-compliance with the indicated scheme, the tool will indicate that the file could not be processed correctly and no collection will be added.

#### Lack of data

After importing data from [step 2](#step-2-import-data), it is possible that data for some tags may be missing. Tags with no original value will be marked with the description in red. In order to predict the data collection, it **will be mandatory to fill in the new value field for these tags**. Once the field is filled in, the description of the tag will change to its default colour.

In case of missing data is **not corrected** for all tags, when predicting, a message will appear in the upper right corner indicating the affected tags and the identifier of the collection that contains them.

In case the missing data is **corrected** for all affected tags, the prediction should be able to run without problems. The results differ in that no original value is displayed, but only the new predicted value and, if applicable, the graph.

### Configuration

#### Basic options

In the general tab, you will find the options that are common to the whole panel. Specifically, they are the following:

- **Plugin language:** It is possible to change the language of the elements that make up the panel to English or Spanish. The default value is English. This will not affect the configuration section.
- **Decimals:** Defines the number of decimals to which the prediction results will be rounded. This rounding will not be applied for the prediction or export, but will only be visual when displaying the results both individually and in the graph.

#### Models

#### Formats

#### Data import queries

#### Extra information

