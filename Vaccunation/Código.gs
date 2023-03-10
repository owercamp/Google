function doGet() {
  let template = HtmlService.createTemplateFromFile("Index");
  let output = template.evaluate();

  return output;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


function abrirInforme(){
  var html = HtmlService.createHtmlOutput('<html>'
  +'<script>'+
         "var urlToOpen = 'https://script.google.com/a/macros/soandes.co/s/AKfycbyk2dsjKCdFiPUJTmRRPbRg6CpOsK19AzxOSd94ZkI/dev';"+
         "var winRef = window.open(urlToOpen);"+
         "google.script.host.close();"
  +'</script>'
  +'</html>')
  .setWidth(90).setHeight(1); 
  SpreadsheetApp.getUi().showModalDialog(html, "Abriendo Informe");
}

function id() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let row = spreadsheet.getActiveSheet().getCurrentCell().getRow();
  let column = spreadsheet.getActiveSheet().getCurrentCell().getColumn();
  Logger.log(`${row} - ${column} - ${spreadsheet.getSheetId()}`);
}

function clearCC() {
  Utilities.sleep(2000);
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let ui = SpreadsheetApp.getUi();
  let tooltip = SpreadsheetApp.getActive();
  let column = spreadsheet.getActiveSheet().getActiveRange().getColumn();

  if (column == 1 && spreadsheet.getSheetName() == "Historia Clinica" && spreadsheet.getActiveSheet().getRange(2, 1).getValue() != "") {
    spreadsheet.setActiveSheet(spreadsheet.getSheetByName("Historia Clinica"));
    let proccess = ui.alert("¿Desea iniciar la separación del tipo de Identificación y su Número?", ui.ButtonSet.YES_NO);
    if (proccess == ui.Button.YES) {
      tooltip.toast("Procesando la información POR FAVOR ESPERE", "📇 Procesando", 5000);
      let range = spreadsheet.getActiveSheet().getRange(2, 1, spreadsheet.getActiveSheet().getLastRow(), 1).getValues();
      spreadsheet.getActiveSheet().getRange("A2").activate();
      range.forEach(element => {
        let splitElement = element.toLocaleString().split(" ");
        spreadsheet.getActiveSheet().getActiveCell().setValue(splitElement[1]);
        spreadsheet.getActiveSheet().getActiveCell().offset(1, 0).activate();
      })
      spreadsheet.getActiveSheet().getRange("A2").activate();
      tooltip.toast("Ejecución Completa", "🎖️ Exito");
      ui.alert("separación completada satisfactoriamente", ui.ButtonSet.OK);
    }
  }
}


async function hideOfColumn() {
  /**
   * Seleccion de la informacion para realizxar la validación
   */
  let arrayCups = [];
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (spreadsheet.getActiveSheet().getSheetName() == "Informe Ventas" && spreadsheet.getActiveSheet().getCurrentCell().getRow() == 1 && spreadsheet.getActiveSheet().getCurrentCell().getColumn() == 2) {

    let htmlOutput = HtmlService
      .createHtmlOutput(`<div><p>Procesando la información <b style="color: red;">POR FAVOR ESPERE</b></p></div>
      <iframe src="https://giphy.com/embed/ZO9b1ntYVJmjZlsWlm" width="360" height="160" frameBorder="0"></iframe>
      <div><p style="color: blue;">Nota:</p><p>Puede continuar usando el ordenador con normalidad</p></div>`)
      .setWidth(400)
      .setHeight(300);
    SpreadsheetApp.getUi().showModelessDialog(htmlOutput, '📇 Procesando');

    let sh = spreadsheet.getSheetByName("Clasificación");
    let clasificacion = sh.getRange(2, 1, sh.getLastRow(), 3).getValues();

    /**
     * Selecciona los numeros cups de la hoja informes ventas para realizar el discriminado
     */
    let shActive = spreadsheet.getSheetByName("Informe Ventas");
    let headers = shActive.getRange(3, 1, 1, shActive.getLastColumn()).getValues();
    /** Reset **/
    try {
      headers[0].forEach(item => {
        spreadsheet.getSheetByName("Informe Ventas").showColumns(headers[0].indexOf(item) + 1);
      })
    } catch (e) {
      Logger.log(e);
    }

    /**
     * Captura del valor a discriminar
     */
    let valor = shActive.getRange("B1").getValue();

    /**
     * Captura de Cups a mostrar
     */
    clasificacion.map(element => {
      if (element[0] != valor) {
        arrayCups.push(element[2].toString());
      }
    })

    /**
     * Ocultamos los cups que no pertenecen a la especialidad y se encuentra en el listado de discriminación
     */
    headers[0].forEach(item => {
      arrayCups.forEach(element => {
        if (item == element) {
          spreadsheet.getSheetByName("Informe Ventas").hideColumns(headers[0].indexOf(item) + 1);
        }
      })
    })

    spreadsheet.getSheetByName("Informe Ventas").getRange("$L4").activate();
    let ran;
    let historys = spreadsheet.getSheetByName("Historia Clinica").getRange(2, 1, spreadsheet.getSheetByName("Historia Clinica").getLastRow(), 14).getValues();
    while (spreadsheet.getCurrentCell().activate().getValue() != "") {
      ran = spreadsheet.getSheetByName("Informe Ventas").getCurrentCell().getRow();
      let lt = spreadsheet.getSheetByName("Informe Ventas").getRange(ran, 17, 1, spreadsheet.getSheetByName("Informe Ventas").getLastColumn()).getValues();
      spreadsheet.getCurrentCell().offset(0, 3).setValue(await COUNTEXAMS(lt));
      spreadsheet.getCurrentCell().offset(0, 4).setValue(await WASPRESENTED(spreadsheet.getSheetByName("Informe Ventas").getCurrentCell().offset(0, 3).getValue(), spreadsheet.getSheetByName("Informe Ventas").getCurrentCell().offset(0, 1).getValue(), historys, spreadsheet.getSheetByName("Informe Ventas").getRange(1, 2).getValue()));
      spreadsheet.getCurrentCell().offset(1, 0).activate();
    }
    spreadsheet.getSheetByName("Informe Ventas").getRange("$O4").activate();

    htmlOutput = HtmlService
      .createHtmlOutput(`<div><p>Ejecución Completa</p></div>`)
      .setWidth(300)
      .setHeight(100);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎖️ Exito');
  }
}

/**
 * Count exams marked.
 * @param{object} input The range to counts. 
 * @return Count exams marked validated columns that are not hidden.
 * @customfunction
*/
function COUNTEXAMS(rango) {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sum = 0;

  for (let x = 0; x < rango[0].length; x++) {
    if (rango[0][x] != "" && spreadsheet.getSheetByName("Informe Ventas").isColumnHiddenByUser(17 + x) == false) {
      sum += 1;
    }
  }
  return sum;
}

/**
 * Confirms if a person showed up for an exam.
 * @param {number} num_exam The exam number.
 * @param {number} id The person's ID.
 * @param {object} rango The range to confirm if the person showed up.
 * @return Validated columns that are not hidden.
 * @customfunction
 */
function WASPRESENTED(num_exam, id, rango, especial) {

  let def = "Sin Registro";
  for (let x = 0; x < rango.length; x++) {
    let exp = specialty(rango[0][8]);
    if (rango[x][0].toString() == id && exp == especial && num_exam == 0) {
      def = "Con Registro";
    }
  }
  return def;
}

function specialty(data ="Certificado Evaluación Medico Ocupacional") {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let clasi = spreadsheet.getSheetByName("Clasificación").getRange(2, 6, spreadsheet.getSheetByName("Clasificación").getLastRow(), 2).getValues().filter(e => (e[0] != "") ? e : "");
  clasi.forEach(element => {
    if (element[0] == data) {
      return element[1];
    }
  })
}



