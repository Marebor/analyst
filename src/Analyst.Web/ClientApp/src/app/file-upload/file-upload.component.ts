import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {

  @ViewChild('fileInput') fileInput: ElementRef;
  @Output() fileSelected: EventEmitter<any> = new EventEmitter<any>();
  fileToUpload: any;

  onFileChange(event) {
    if(event.target.files.length > 0) {
      this.fileSelected.emit(event.target.files[0]);
    }
  }
}
