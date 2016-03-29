﻿declare var gapi

interface DriveFile {
    id: string
    name: string;
    downloadUrl: string;
    webContentLink: string;
}

class DriveAPI{

    CLIENT_ID: string = '868894976686-v9jemj2h2ejkjhf0tplf6jp4v4vfleju.apps.googleusercontent.com';

    SCOPES: string[] = ['https://www.googleapis.com/auth/drive'];
    faustFolder: string = "FaustPlayground";
    isFaustFolderPresent: boolean = false;
    faustFolderId: string;
    lastSavedFileId: string;
    lastSavedFileMetadata: string;
    tempBlob: Blob;


    /**
     * Check if current user has authorized this application.
     */
    checkAuth() {
        gapi.auth.authorize(
            {
                'client_id': this.CLIENT_ID,
                'scope': this.SCOPES.join(' '),
                'immediate': true
            }, (authResult) => { this.handleAuthResult(authResult) });
    }

    /**
     * Handle response from authorization server.
     *
     * @param {Object} authResult Authorization result.
     */
    handleAuthResult(authResult) {
        var buttonConnect = document.getElementById('buttonConnectLoadDrive');
        var buttonConnect2 = document.getElementById('buttonConnectSaveDrive');
        if (authResult && !authResult.error) {
            // Hide auth UI, then load client library.

            var event = new CustomEvent("authon")
            document.dispatchEvent(event);
            this.loadDriveApi();
        } else {
            // Show auth UI, allowing the user to initiate authorization by
            // clicking authorize button.
            var event = new CustomEvent("authoff")
            document.dispatchEvent(event);
        }
    }

    /**
     * Initiate auth flow in response to user clicking authorize button.
     *
     * @param {Event} event Button click event.
     */
    handleAuthClick(event) {
        gapi.auth.authorize(
            { client_id: this.CLIENT_ID, scope: this.SCOPES, immediate: false },
            (authResult) => { this.handleAuthResult(authResult) });
        return false;
    }

    /**
     * Load Drive API client library.
     */
    loadDriveApi() {
        gapi.client.load('drive', 'v2', () => { this.listFolder() });
    }

    /**
     * Print files.
     */

    listFolder() {
        var request = gapi.client.drive.files.list({
            'maxResults': 10
        });

        request.execute((resp) => {
            var files = resp.items;
            if (files && files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.mimeType == "application/vnd.google-apps.folder" && file.title=="FaustPlayground") {
                        //this.appendPre(file.title,file.id);
                        this.isFaustFolderPresent = true
                        this.faustFolderId = file.id;
                        this.openFiles(file.id);
                    }
                }
                if (!this.isFaustFolderPresent){
                    this.createFaustFolder();
                }
            } else {
                //this.appendPre('No files found.',null);
                this.appendPre('No files found.', null);
            }
        });
    }
    openFiles(folderId) {
        var request=gapi.client.drive.children.list({
            'folderId': folderId,
            'q': 'trashed = false'
        });

        request.execute((resp) => {
            var files = resp.items;
            if (files && files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    this.getFileMetadata(file.id);
                    if (file.fileExtension == "json") {
                        //this.appendPre(file.title,file.id);
                        this.appendPre(file.title, file.id);
                    }
                }
            } else {
                //this.appendPre('No files found.',null);
                this.appendPre('No files found.', null);
            }
        })

    }
    getFileMetadata(fileId) {
        var request = gapi.client.drive.files.get({
            'fileId': fileId
        });
        request.execute((file) => {
            this.appendPre(file.title, file.id);
        })
    }
    createFaustFolder() {
        var body = {
            'title': this.faustFolder,
            'mimeType': "application/vnd.google-apps.folder"
        };

        var request = gapi.client.drive.files.insert({
            'resource': body
        });

        request.execute((resp)=>{
            console.log('Folder ID: ' + resp.id);
            this.faustFolderId = resp.id;
        });
    }
    

    /**
     * Append a pre element to the body containing the given message
     * as its text node.
     *
     * @param {string} message Text to be placed in pre element.
     */
    appendPre(name,id) {
        var option = document.createElement("option");
        option.value = id;
        option.textContent = name;

        var event = new CustomEvent("fillselect", { 'detail': option })
        document.dispatchEvent(event);
        
    }
    /**
 * Download a file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
    downloadFile(file: DriveFile, callback) {
        if (file.downloadUrl) {
            var accessToken = gapi.auth.getToken().access_token;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file.downloadUrl);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function () {
                callback(xhr.responseText);
            };
            xhr.onerror = function () {
                callback(null);
            };
            xhr.send();
        } else {
            callback(null);
        }
    }
    /**
 * Print a file's metadata.
 *
 * @param {String} fileId ID of the file to print metadata for.
 */
    getFile(fileId,callback):any {
        var request = gapi.client.drive.files.get({
            'fileId': fileId,

        });
        request.execute((resp) => {
            this.lastSavedFileMetadata = resp;
            callback(resp)
        })
    }


    createFile(fileName: string, callback) {
        var faustFolderId = this.faustFolderId;

        var request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'POST',
            'body': {
                "title": fileName+".json",
                "mimeType": "application/json",
            }
        });

        request.execute((resp) => {
            this.lastSavedFileId=resp.id
            callback(resp.parents[0].id,resp.id)
        });
        
    }
    removeFileFromRoot(Id, fileId) {
        var request = gapi.client.drive.parents.delete({
            'fileId': fileId,
            'parentId': Id,
        });
        request.execute((resp) => {
            this.insertFileIntoFolder(this.faustFolderId, fileId)
        });
    }
    insertFileIntoFolder(folderId, fileId) {
        var body = { 'id': folderId };
        var request = gapi.client.drive.parents.insert({
            'fileId': fileId,
            'resource': body
        });
        request.execute((resp) => {
            this.getFile(this.lastSavedFileId, () => {
                this.updateFile(this.lastSavedFileId, this.lastSavedFileMetadata, this.tempBlob, null)
            });
        });
    }
    /**
 * Update an existing file's metadata and content.
 *
 * @param {String} fileId ID of the file to update.
 * @param {Object} fileMetadata existing Drive file's metadata.
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Callback function to call when the request is complete.
 */
updateFile(fileId, fileMetadata, fileData, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function (e) {
        var contentType = fileData.type || 'application/octet-stream';
        // Updating the metadata is optional and you can instead use the value from drive.files.get.
        var base64Data = btoa(reader.result);
        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(fileMetadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files/' + fileId,
            'method': 'PUT',
            'params': { 'uploadType': 'multipart', 'alt': 'json' },
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });
        if (!callback) {
            callback = () => {
                var event = new CustomEvent("updatecloudselect");
                document.dispatchEvent(event)

            };
        }
        request.execute(callback);
    }
}
}