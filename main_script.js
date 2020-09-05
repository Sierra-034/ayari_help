//MENU IN THE TOOLBAR
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('EduJuega')
      .addItem('Formar Equipos', 'mainProcess') //(caption, function name)
      .addItem('Eliminar Documentos', 'deleteFiles') //(caption, function name)
       
  .addSeparator()
  .addItem('Acerca de', 'aboutFile')
   
  .addToUi();
}

function mainProcess() {
    createFolders()
    teamsMaker();
    showPicker();
}

// CREATE FOLDER AND SUB-FOLDER
function createFolders() {
  
    var ss = SpreadsheetApp.getActiveSpreadsheet();     // Get current spreadSheet
    var currentFolder = getInmidiateParentFrom(ss.getId());
    var eduJuegaFolder = createSubFolderFrom(currentFolder, "EduJuega");
    createSubFolderFrom(eduJuegaFolder, "EquiposEdu");
}

function getInmidiateParentFrom(ssId) {
    
    var file = DriveApp.getFileById(ssId);
    var parentsIterator = file.getParents();
    return parentsIterator.next();
}

function createSubFolderFrom(folder, newFolderName) {
    var check = folder.getFoldersByName(newFolderName);
    return check.hasNext() ? check.next() : folder.createFolder(newFolderName);
}

// PICKER
function showPicker() {
  var html = HtmlService.createHtmlOutputFromFile('Picker.html')
      .setWidth(600)
      .setHeight(425)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showModalDialog(html, 'Elige un archivo');
}

function getOAuthToken() {
  DriveApp.getRootFolder();
  return ScriptApp.getOAuthToken()
}

function testSpinner(){
 SpreadsheetApp.getActiveSpreadsheet().toast("Trabajando...","",-1);
  Utilities.sleep(5000);
 SpreadsheetApp.getActiveSpreadsheet().toast("Ya casi....");
}

//TEAMS MAKER
function teamsMaker(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Plantilla");//get template sheet
    var teamSize = sheet.getRange("E1").getValue();//team size
    Logger.log('team size  '+teamSize);
    var last = sheet.getLastRow();//end of roster size

    //duplicate sheet with roster of first and last name
    ss.setActiveSheet(sheet);
    ss.duplicateActiveSheet();
    ss.setActiveSheet(sheet);

    var lastOne = last+1;
  
    //combine first and last name
    for(var i=4; i<lastOne; i++){
        var lastName = sheet.getRange(i,1).getValue();
        var firstName = sheet.getRange(i,2).getValue();
        var firstLast = firstName+' '+lastName;

        sheet.getRange(i,2).setValue(firstLast);
    }
  
    sheet.deleteColumn(1);
    sheet.getRange(3,1).setValue('Nombre');

    //remove blank rows
    Logger.log('Get last row: '+sheet.getLastRow());
    Logger.log('Get Max Rows: '+sheet.getMaxRows());

    var blankRows = sheet.getMaxRows() - lastOne;

    sheet.deleteRows(lastOne, blankRows);
    sheet.setName("Equipos");//Rename active sheet

    var sheet = ss.getSheets()[1];//get second sheet
    sheet.setName("Plantilla");//Rename second sheet

    //hide template sheet
    var sheet = ss.getSheetByName("Plantilla");
    sheet.hideSheet();
  
    //share current spreadsheet
    var data = sheet.getDataRange().getValues();   
    var last = sheet.getLastRow();//end of roster size
    var lastOne = last+1;

    for(var i=4; i<lastOne; i++){
        var sEmail = sheet.getRange(i,3).getValue();
        ss.addViewer(sEmail);
    }
  
  //prompt for picker 
  var ui = SpreadsheetApp.getUi();
}

//CALL THE DOCUMENT TO BE COPIED
function doSomething(id){
  
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];//get first sheet
  var teamSize = sheet.getRange("D1").getValue();//team size
  Logger.log('team size  '+teamSize);
  
  var last = sheet.getLastRow();//end of roster size
  
  // get file
  var getFile = DriveApp.getFileById(id);
  var docName = getFile.getName();//name of document
  Logger.log('Doc Name '+docName);
  
  var userProperties = PropertiesService.getScriptProperties();
  userProperties.setProperty('docName', docName);
  userProperties.setProperty('id',id);
  
  ss.toast('Creando Documentos');
  
  Logger.log('last '+last);
 
  // ask if the teams will be created manually or automatically 
  var ask = ui.prompt('¿Quieres formar equipos automáticamente?',ui.ButtonSet.YES_NO);
  var response = ask.getSelectedButton();
  
  var roster = sheet.getRange(4,1,last-3,3);//roster of names
  Logger.log('roster '+roster.getA1Notation());
  var notation = roster.getA1Notation();
  
  if(response =='YES'){
    roster.randomize();
    userProperties.setProperty('response', 'YES');
   
  }
  
  else{
    
    roster.sort({column:3, ascending:true});
    userProperties.setProperty('response', 'NO');
    
  }//end else
  
   toSort();
}

// SORT ROSTER  
function toSort(){
       
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];//get first sheet
  var teamSize = sheet.getRange("D1").getValue();//team size   
  var last = sheet.getLastRow();//end of roster size 
  var userProperties = PropertiesService.getScriptProperties();
  var id = userProperties.getProperty('id');
  var response = userProperties.getProperty('response');
    
  //call up the function to sort the range
  //sheet.getRange(notation).sort(3);//sort by random number
  sheet.getRange("D3").setValue('No. del Equipo');
  sheet.getRange("E3").setValue('Tablero de Juego');
  sheet.getRange("E1").setValue('Total de Equipos');
  var rosterSize = last-3;
  var teams = rosterSize/teamSize;
  sheet.getRange("F1").setValue('=ceiling('+teams+',1)');//round up 
  var numTeams = sheet.getRange("F1").getValue();//number of teams
  var k=1;//team 1
  
  //get file
  var getFile = DriveApp.getFileById(id);
  var docName = getFile.getName();//name of document
  Logger.log('Doc Name '+docName);   
  
  //make a template copy
  var id = DriveApp.getFoldersByName("EquiposEdu").next().getId();
  var folder = DriveApp.getFolderById(id);
  var newDoc = getFile.makeCopy('Equipo '+k + ' ' + docName,folder);//copy the doc
  var newDocName = newDoc.getName();
  var newDocLink = newDoc.getUrl();//get link to document  
    
    if(response == 'YES'){ 
  
  //assign automatic teams
  var row = 4;//start on the 4th row
  
      while(row<last+1){
        for(var m=0;m<teamSize;m++){
        sheet.getRange(row,4).setValue(k);
     
      row = row + 1;
    }
        
    k = k+1//increase team number
    
  }//end while
    }//end if
   
    
   //assign manual teams
      else{
        var k = 1;
        Logger.log('VALUE OF K for non random '+k);
        sheet.getRange(4,4).setValue(k);
        var row = 5;
        while(row<last+1){
          
          var team = sheet.getRange(row-1,3).getValue();
          var test = sheet.getRange(row,3).getValue();
          
          if(team == test){
            Logger.log('TEAM IS '+team);
            sheet.getRange(row,4).setValue(k);
          }
          else{
            Logger.log('New Team! '+k)
            var k = k+1;
            Logger.log('New Team! '+k)
            sheet.getRange(row,4).setValue(k);
          }
                   
          row = row + 1;
        }//end while
      }//end else
 
    
    
    var data = sheet.getDataRange().getValues();   
    var len = data.length; 
    
    //first student is row 4 so javascript 3
    var sEmail = data[3][1];
    Logger.log(sEmail);
    var sName = data[3][0];
    var team = data[3][3];
    
    //create new document
    var id = DriveApp.getFoldersByName("EquiposEdu").next().getId();
    var folder = DriveApp.getFolderById(id);
    var newDoc = getFile.makeCopy('Equipo '+ team+' ' + docName,folder);
    var newDocName = newDoc.getName();
    var newDocLink = newDoc.getUrl();//get link to document
    var newDocId = newDoc.getId();//get document id
    Logger.log(typeof newDocLink);
  
        sheet.getRange(4,5).setValue(newDocLink); 
        newDoc.addEditor(sEmail);
    var newDocName = newDocName+' '+sName;
    
    //for(var i=4; i<len; i++){
      var i=4;
      while(i<len){
  
      var g = i-1;

     //is the previous team the same?
          if(data[i][3]==data[g][3]){
        
            var sEmail = data[i][1];
            var sName = data[i][0];
            var team = data[i][3];
           
        newDoc.addEditor(sEmail); 
        var newDocName = newDocName+' '+sName;  
        newDoc.setName(newDocName);
        ss.toast('Actualizando '+sName, 'Por favor se paciente, toma tiempo crear los documentos.');
       
        var r = i+1;
        sheet.getRange(r,5).setValue(newDocLink);
        var i=i+1; 
            
            }//end if 
        
         else{
           var id = DriveApp.getFoldersByName("EquiposEdu").next().getId();
           var folder = DriveApp.getFolderById(id);
           var newDoc = getFile.makeCopy('Equipo '+data[i][3] + ' ' + docName,folder);
           var newDocName = newDoc.getName();
           var newDocLink = newDoc.getUrl();//get link to document
           
           var sEmail = data[i][1];
           var sName = data[i][0];
           var team = data[i][3];
            
        newDoc.addEditor(sEmail); 
        var newDocName = newDocName+' '+sName; 
        newDoc.setName(newDocName);
        var r = i+1;
        sheet.getRange(r,5).setValue(newDocLink);
        var i=i+1; 
         
         }
        
    }//end for
  
  //delete email column
  sheet.deleteColumn(2);
  var newLast =  sheet.getLastRow();
  sheet.deleteRows(last+1,newLast-last);//delete extra rows  

}
// REMOVE EDITORS AND DELETE FILES IN SUB-FOLDER
function deleteFiles() {
  var id = DriveApp.getFoldersByName("EquiposEdu").next().getId();
  var folder = DriveApp.getFolderById(id);
  var files = folder.getFiles();

     //remove editors in sub-folder files
     while(files.hasNext()){
     var file = files.next();
     var docs = DriveApp.getFileById(file.getId());
     var users = docs.getEditors();
        for (i in users) {
          email = users[i].getEmail();
          if (email !="") {
          docs.removeEditor(email);
          }      
     }
      }
  var id = DriveApp.getFoldersByName("EquiposEdu").next().getId();
  var folder = DriveApp.getFolderById(id);
  var files = folder.getFiles();
     
     //delete sub-folder files
     while(files.hasNext()){
     files.next().setTrashed(true)
}
  
  //delete teams sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];//get first sheet 
  ss.deleteSheet(sheet);
  
  //show template sheet
  var sheet = ss.getSheetByName("Plantilla");
  sheet.showSheet();
  
  //remove viewers from current sheet
  var sheet = ss.getSheetByName("Plantilla");
  var last = sheet.getLastRow();//end of roster size
  var lastOne = last+1;

    for(var i=4; i<lastOne; i++){
    var sEmail = sheet.getRange(i,3).getValue();
    ss.removeViewer(sEmail);
}
}



