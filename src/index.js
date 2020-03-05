(function() {
  "use strict";
  // This config stores the important strings needed to
  // connect to the foursquare API and OAuth service
  //
  // Storing these here is insecure for a public app
  // See part II. of this tutorial for an example of how
  // to do a server-side OAuth flow and avoid this problem
  var config = {
    clientId: process.env.CLIENT_ID,
    redirectUri: process.env.REDIRECT_URL,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    responseType: "code",
    scope: "profile email"
  };

  // Called when web page first loads and when
  // the OAuth flow returns to the page
  //
  // This function parses the access token in the URI if available
  // It also adds a link to the foursquare connect button
  $(document).ready(function() {
    var accessToken = Cookies.get("accessToken");
    var hasAuth = accessToken && accessToken.length > 0;
    updateUIWithAuthState(hasAuth);

    $("#connectbutton").click(function() {
      if (!hasAuth) {
        doAuthRedirect();
      }
    });

    $("#executequerybutton").click(function() {
      tableau.connectionName = "MA Data";
      tableau.submit();
    });
  });

  // An on-click function for the connect to foursquare button,
  // This will redirect the user to a Foursquare login
  function doAuthRedirect() {
    var appId = config.clientId;
    if (tableau.authPurpose === tableau.authPurposeEnum.ephemerel) {
      appId = config.clientId; // This should be Desktop
    } else if (tableau.authPurpose === tableau.authPurposeEnum.enduring) {
      appId = config.clientId; // This should be the Tableau Server appID
    }

    var url = `${config.authUrl}?response_type=${config.responseType}&client_id=${appId}&redirect_uri=${config.redirectUri}&scope=${config.scope}`;
    window.location.href = url;
  }

  // This function toggles the label shown depending
  // on whether or not the user has been authenticated
  function updateUIWithAuthState(hasAuth) {
    if (hasAuth) {
      $(".notsignedin").css("display", "none");
      $(".signedin").css("display", "block");
    } else {
      $(".notsignedin").css("display", "block");
      $(".signedin").css("display", "none");
    }
  }

  //------------- Tableau WDC code -------------//
  // Create tableau connector, should be called first
  var myConnector = tableau.makeConnector();

  // Init function for connector, called during every phase but
  // only called when running inside the simulator or tableau
  myConnector.init = function(initCallback) {
    tableau.authType = tableau.authTypeEnum.custom;

    // If we are in the auth phase we only want to show the UI needed for auth
    if (tableau.phase == tableau.phaseEnum.authPhase) {
      $("#getvenuesbutton").css("display", "none");
    }

    if (tableau.phase == tableau.phaseEnum.gatherDataPhase) {
      // If the API that WDC is using has an endpoint that checks
      // the validity of an access token, that could be used here.
      // Then the WDC can call tableau.abortForAuth if that access token
      // is invalid.
    }

    var accessToken = Cookies.get("accessToken");
    console.log("Access token is '" + accessToken + "'");
    var hasAuth =
      (accessToken && accessToken.length > 0) || tableau.password.length > 0;
    updateUIWithAuthState(hasAuth);

    initCallback();

    // If we are not in the data gathering phase, we want to store the token
    // This allows us to access the token in the data gathering phase
    if (
      tableau.phase == tableau.phaseEnum.interactivePhase ||
      tableau.phase == tableau.phaseEnum.authPhase
    ) {
      if (hasAuth) {
        tableau.password = accessToken;

        if (tableau.phase == tableau.phaseEnum.authPhase) {
          // Auto-submit here if we are in the auth phase
          tableau.submit();
        }

        return;
      }
    }
  };

  // Declare the data to Tableau that we are returning from Foursquare
  myConnector.getSchema = function(schemaCallback) {
    var schema = [];

    var madbRequestTableColumns = [
      { id: "requestId", alias: "MADB Number", dataType: "int" },
      { id: "deliveryMethod", dataType: "string" },
      { id: "format", dataType: "string" },
      { id: "variantInfo", dataType: "string" },
      { id: "submitterUnix", dataType: "string" },
      { id: "proNumber", dataType: "int" },
      { id: "purNumber", dataType: "int" },
      { id: "commonName", dataType: "string" },
      { id: "isotype", dataType: "string" },
      { id: "isotypeOther", dataType: "string" },
      {
        id: "experimentCollectionId",
        alias: "Experiment Collection GQL ID",
        dataType: "string"
      }
    ];
    var madbRequestTable = {
      id: "madbRequestTable",
      columns: madbRequestTableColumns
    };
    schema.push(madbRequestTable);

    var madbAssaySummaryTableColumns = [
      {
        id: "experimentCollectionId",
        alias: "Experiment Collection GQL ID",
        dataType: "string"
      },
      {
        id: "stressPlatform",
        alias: "Stress platform name",
        dataType: "string"
      },
      { id: "requestId", alias: "MADB Number", dataType: "int" },
      { id: "requestedTestInfoId", alias: "Test ID in MADB", dataType: "int" }
    ];
    var madbAssaySummaryTable = {
      id: "madbAssaySummaryTable",
      columns: madbAssaySummaryTableColumns
    };
    schema.push(madbAssaySummaryTable);

    var maChromatographyResultsTableColumns = [
      { id: "requestedTestInfoId", alias: "Test ID in MADB", dataType: "int" },
      { id: "secMainValue", alias: "Main Peak value (SEC)", dataType: "float" },
      { id: "iecMainValue", alias: "Main Peak value (IEC)", dataType: "float" },
      {
        id: "secHmwfValue",
        alias: "Sum of HMW Forms value (SEC)",
        dataType: "float"
      },
      {
        id: "secLmwfValue",
        alias: "Sum of LMW Forms value (SEC)",
        dataType: "float"
      },
      {
        id: "iecAcidicsValue",
        alias: "Acidics value (IEC)",
        dataType: "float"
      },
      { id: "iecBasicsValue", alias: "Basics value (IEC)", dataType: "float" },
      { id: "secChromatogram", alias: "SEC Chromatogram", dataType: "string" },
      { id: "iecChromatogram", alias: "IEC Chromatogram", dataType: "string" },
      { id: "variable", alias: "Variable", dataType: "string" }
    ];
    var maChromatographyResultsTable = {
      id: "maChromatographyResultsTable",
      columns: maChromatographyResultsTableColumns
    };
    schema.push(maChromatographyResultsTable);

    var maMassSpecResultsTableColumns = [];

    schemaCallback(schema);
  };

  // This function actually make the foursquare API call and
  // parses the results and passes them back to Tableau
  myConnector.getData = function(table, doneCallback) {
    var dataToReturn = [];
    var hasMoreData = false;

    var accessToken = tableau.password;

    const queryString = `
    {
      madbRequests(last:100) {
        edges {
          node {
            requestId
            deliveryMethod
            format
            variantInfo
            submitterUnix
            proNumber
            purNumber
            commonName
            portfolioName
            isotype
            isotypeOther
            experimentCollection{
              id
            }
            assayResults {
              requestedTestInfo {
                testId
                testNumber
                buffer
              }
              stressPlatform
              maMsResults {
                cdr
                cdrSequence
                peptide
                site
                sitePosition
                kabat
                variable
                modification
                percentModified
                nativeValue
                dehydratedValue
                isomerizationValue
                dioxidationValue
                trioxidationValue
                oxidationValue
                deamidatedValue
                ammonialossValue
                trpHydroxykynureninValue
                trpKynureninValue
              }
              maChromatographyResults {
                secMainValue
                secHmwfValue
                secLmwfValue
                secChromatogram
                iecMainValue
                iecBasicsValue
                iecAcidicsValue
                iecChromatogram
                variable
              }
            }
          }
        }
      }
    }    
    `;

    fetch(process.env.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ query: queryString })
    })
      .then(r => r.json())
      .then(data => {
        let tableData = [];

        tableau.log(data);
        data.data.madbRequests.edges
          .map(e => ({ ...e.node }))
          .map(request => {
            if (table.tableInfo.id == "madbRequestTable") {
              tableData.push({
                requestId: request.requestId,
                deliveryMethod: request.deliveryMethod,
                format: request.format,
                variantInfo: request.variantInfo,
                submitterUnix: request.submitterUnix,
                proNumber: request.proNumber,
                purNumber: request.purNumber,
                commonName: request.commonName,
                portfolioName: request.portfolioName,
                isotype: request.isotype,
                isotypeOther: request.isotypeOther,
                experimentCollectionId:
                  request.experimentCollection &&
                  request.experimentCollection.id
              });
            }

            request.assayResults.map(result => {
              if (table.tableInfo.id == "madbAssaySummaryTable") {
                tableData.push({
                  experimentCollectionId:
                    request.experimentCollection &&
                    request.experimentCollection.id,
                  requestId: request.pk,
                  requestedTestInfoId:
                    result.requestedTestInfo && result.requestedTestInfo.testId,
                  stressPlatform: result.stressPlatform
                });
              }

              if (table.tableInfo.id == "maChromatographyResultsTable") {
                result.maChromatographyResults.map(cm_result => {
                  tableData.push({
                    requestedTestInfoId:
                      result.requestedTestInfo &&
                      result.requestedTestInfo.testId,
                    secMainValue: cm_result.secMainValue,
                    iecMainValue: cm_result.iecMainValue,
                    secHmwfValue: cm_result.secHmwfValue,
                    secLmwfValue: cm_result.secLmwfValue,
                    iecAcidicsValue: cm_result.iecAcidicsValue,
                    iecBasicsValue: cm_result.iecBasicsValue,
                    secChromatogram: cm_result.secChromatogram,
                    iecChromatogram: cm_result.iecChromatogram,
                    variable: cm_result.variable
                  });
                });
              }
              // if (table.tableInfo.id == "")
            });
          });

        table.appendRows(tableData);
        doneCallback();
      })
      .catch(err => {
        tableau.abortWithError(`Error: ${err}`);
      });
  };

  // Register the tableau connector, call this last
  tableau.registerConnector(myConnector);
})();
