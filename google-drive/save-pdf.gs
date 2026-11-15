// InfoRetriever: saves a copy of each PDF uploaded on the Upload POEMs tab to Google Drive.
// It runs as you (the Google account that deploys it), so the files are yours.
//
// Set-up (once, about 5 minutes):
//  1. Go to https://script.google.com, click New project, delete what is there and paste in
//     this whole file. Name the project "InfoRetriever PDF copies".
//  2. In Google Drive, open the folder the monthly folders go in ("POEMs 2026 and Beyond" >
//     "PDF folders"). Its address ends in /folders/<ID>. Copy that ID.
//  3. In the script editor: Project Settings (gear icon) > Script Properties > Add script property:
//       PARENT_FOLDER_ID   the ID from step 2
//       SECRET             a long password you make up (the same one goes into Render)
//  4. Deploy > New deployment > Select type: Web app. Execute as: Me. Who has access: Anyone.
//     Click Deploy, allow access to your Drive when asked, and copy the Web app URL (ends in /exec).
//  5. In Render, add the environment variables PDF_DRIVE_URL (the URL from step 4) and
//     PDF_DRIVE_SECRET (the password from step 3).
// "Anyone" can reach the URL, but without the SECRET it does nothing.
// After changing this script, use Deploy > Manage deployments > Edit > Version: New version,
// so the same URL keeps working.

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var body = JSON.parse(e.postData.contents);
    if (!props.getProperty('SECRET') || body.secret !== props.getProperty('SECRET')) return reply({ ok: false, error: 'Not allowed.' });
    var parent = DriveApp.getFolderById(props.getProperty('PARENT_FOLDER_ID'));
    var name = String(body.folder || '').replace(/[\/\\]/g, ' ').trim();
    if (!name) return reply({ ok: false, error: 'No folder name.' });
    var found = parent.getFoldersByName(name);
    var folder = found.hasNext() ? found.next() : parent.createFolder(name);
    var blob = Utilities.newBlob(Utilities.base64Decode(body.data), 'application/pdf', String(body.fileName || 'article.pdf'));
    var file = folder.createFile(blob);
    return reply({ ok: true, url: file.getUrl() });
  } catch (err) {
    return reply({ ok: false, error: String(err && err.message || err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
