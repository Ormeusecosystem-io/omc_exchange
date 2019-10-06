/* global AlphaPoint, document, localStorage, APConfig */
import React from 'react';
import axios from '../axios';
import Webcam from 'react-webcam';
import { MoonLoader } from "react-spinners";
import DocumentTooltip  from './documentTooltip';
import {checkErrorCode} from './helper';

class KycUpload extends React.Component {
  
    constructor(props) {
        super(props);
        this.state = {
            openCamera: false,
            file: null,
            filename: "",
            imageCaptue: "",
            select: true,
            uploading: false,
            uploaded: false,
            uploadFailed: false,
            fileNotSupported: false,
            fileNotSupportedErr: "",
            maxUploadDocuments: false,
            maxUploadDocumentsErr: "",
            desktop: null,
            fileSrc: "",
            poiType: '',
            porType: '',
            dropdown: false,
            documentTypeErr: false
        }
    }

    getBase64(file){
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
    }

    onChange(e){
        e.persist();
        const file = e.target.files[0]
        this.validateFileUpload(file)
        if(file && this.validateFileUpload(file)){
            this.getBase64(e.target.files[0]).then(basedFile => {
                this.setState({ 
                    ...this.state,
                    file,
                    filename: file.name,
                    fileNotSupported: false,
                    fileSrc: basedFile,
                    base64: null
                })
            }).catch(e => console.log(e))
        }
    }

    validateFileUpload(file) {
        let filename = file.name,
            filesize = file.size,
            filetype = file.type 
            filesize = filesize/1024/1024 < 5.1

        if (filesize && filetype == "image/png" || filesize && filetype == "image/jpeg" || filesize && filetype == "image/jpg" || filesize && filetype == "application/pdf"  ) {               
            return true 
        } 

        let errMsg = filesize ? "Document only allowed file types of PDF, PNG and JPG." : "Document size limit to 5MB";
        
        this.setState({fileNotSupportedErr: errMsg, fileNotSupported: true})
        return false        
    }

    toggleCamera = () => {
        const state = {};
        if(!this.state.openCamera){
            state.base64 = ""
        }
        this.setState({...this.state, openCamera: !this.state.openCamera, ...state});
    }

    componentDidMount(){
        // console.log(window.innerWidth > 768)
        this.setState({ desktop: window.innerWidth > 768 })
    }

    componentDidUpdate(prevProps, prevState){
        if(prevProps.isPoi !== this.props.isPoi){
            this.setState({
                ...this.state, 
                base64: null, 
                fileSrc: "", 
                filename: "", 
                poiType: "", 
                porType: "", 
                documentTypeErr: false, 
                fileNotSupported: false,
                fileNotSupportedErr: "",
                maxUploadDocuments: false,
                maxUploadDocumentsErr: "",
                imageCaptue: "",
                uploadFailed: false
            });
        }
    }
    setRef = webcam => this.webcam = webcam;

    capture = (e) => {
        const base64 = this.webcam.getScreenshot();
        if(base64){
            this.setState({...this.state, base64, filename: "Image captured"});
        }
    }

    resetImg = () => {
        this.setState({base64: "", filename: ""});
    }

    mobileCamera = () => {
        document.getElementById('inputFile').click();
    }

    maxUploadDocuments(){
        axios.put(`/cps/document/${this.props.isPoi ? 'identity' : 'residence'}/uploadApprove`).then(res => {
            if(this.props.isPoi) {
                return this.props.changeStep(3)
            } else {
                return this.props.changeStep(4)
            }
        }).catch(err => {
            checkErrorCode(err)
        });
    }

    onSubmit(){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        if((this.props.isPoi && this.state.poiType === "") || (!this.props.isPoi && this.state.porType === "")){
            return this.setState({...this.state, documentTypeErr: true})
        }
        if(this.state.maxUploadDocuments) {
            return this.maxUploadDocuments()
        }
        
        this.setState({...this.state, select: false, uploading: true});
        const formData = new FormData();
        formData.append(this.props.isPoi ? 'identityType' : 'residenceType', this.props.isPoi ? this.state.poiType : this.state.porType);
        formData.append(this.props.isPoi ? 'identityFile' : 'residenceFile', this.state.filename === "Image captured" ? this.state.base64 : this.state.file);
        axios.put(`/cps/document/${this.props.isPoi ? 'identity' : 'residence'}`, formData)
        .then(res => {
            if(res.status === 201) {
                axios.put(`/cps/document/${this.props.isPoi ? 'identity' : 'residence'}/uploadApprove`).then(res => {
                    this.props.changeStep(this.props.isPoi ? 3 : 4)
                }).catch(e => {
                    
                });
                this.setState({...this.state, uploading: false, uploaded: true, base64: null, fileSrc: "", filename: "", poiType: "", porType: ""});
            }
         })
        .catch(err => {
            if(err && err.response && err.response.status === 401){
                return checkErrorCode(err)
            }
            const errMsg = err.response && err.response.data && err.response.data.errorMessage ? err.response.data.errorMessage : "Upload failed please try again" ;
            const globalErrMsg = errMsg === "Maximum document upload error";
            this.setState({...this.state, uploading: false, uploadFailed: true, maxUploadDocumentsErr: errMsg, maxUploadDocuments: globalErrMsg});
            setTimeout(() => {
                this.setState({...this.state, uploadFailed: false});
            }, 2000)
        })
    }

    cancel(){
        this.setState({...this.state, openCamera: false, base64: "", filename: ""})
    }

    onChangeType(event, value){
        event.stopPropagation();
        this.props.isPoi ? this.setState({...this.state, poiType: value, dropdown: false, documentTypeErr: false}) : this.setState({...this.state, porType: value, dropdown: false, documentTypeErr: false})
    }

    toggleDropdown(flag){
        this.setState({...this.state, dropdown: flag})
    }
   
    render() {
        const poiOptions = ['identity card', 'passport'];
        const porOptions = ['bank statement', 'utility bill']
        return (
            <div className="poi-container">
                <h2>{this.props.isPoi ? "Provide proof of your Identity" : "Provide proof of your residence"}</h2>
                <h3>{this.props.isPoi ? "Please upload or scan a copy of your Passport or Identity card" : "Please upload or scan a copy of your Bank Statement or Utility Bill"}</h3>
                {(this.state.uploadFailed) && 
                    <div id="tooltip">
                        {this.state.maxUploadDocuments && <div>{this.state.maxUploadDocumentsErr}</div>}
                        <div>Upload failed.</div>
                    </div>
                }
                
                <div className="inner-container">
                    <div className="document">
                        <DocumentTooltip title={this.props.isPoi ? "Passport or Identity card" : "Bank Statement or Utility Bill"} content="just text"/>
                        <div className="document-holder">
                            {
                                !this.state.base64 && !this.state.fileSrc
                                ?
                                <div className="no-file">
                                    <img src="img/upload-big.svg"/>
                                    <span>No file selected</span>
                                </div>
                                :
                                <img src={this.state.base64 ? this.state.base64 : this.state.fileSrc}/>
                            }
                        </div>
                        {this.state.fileNotSupported && <p style={{color: "salmon", fontSize: "12px", fontWeight: "500"}}>{this.state.fileNotSupportedErr}</p>}
                        <div className="supported" style={{marginTop: "17px"}}>Supported formats: <span>JPG, PNG, PDF</span></div>
                        <div className="supported">Maximum file size: <span>5 MB</span></div>
                    </div>
                    <div className="buttons">
                        <div className="document-type-select" onClick={() => this.toggleDropdown(true)}>
                            <div id="document-type-select-container">
                                <span>
                                    {this.props.isPoi 
                                        ? this.state.poiType ? this.state.poiType : "Select type of document"
                                        : this.state.porType ? this.state.porType : "Select type of document"
                                    }
                                </span>
                                {
                                    this.state.dropdown &&
                                    <ul onMouseLeave={() => this.toggleDropdown(false)}>
                                        {this.props.isPoi 
                                            ? poiOptions.map((option, i) => <li key={i} value={option} onClick={(e) => this.onChangeType(e, option)}>{option}</li>) 
                                            : porOptions.map((option, i) => <li key={i} value={option} onClick={(e) => this.onChangeType(e, option)}>{option}</li>)
                                        }
                                        
                                    </ul>
                                }
                                <div id="select-currency-submit-arrow"/>
                            </div>
                        </div>
                        {this.state.documentTypeErr && <p>Please select document type</p>}
                        <div className="upload-buttons-holder">
                            <label htmlFor="inputFile">
                                <img src="img/uploadf.svg"/>
                                {this.state.fileSrc === "" ? "Upload file" : "Change file" }
                                <input id="inputFile" onChange={e => this.onChange(e)} type="file" accept="image/*;capture=camera" style={{display: "none"}}/>
                            </label>
                            <span>or</span>
                            <label onClick={this.mobileCamera} className="mobile">
                                <img src="img/scan.svg"/>
                                Scan file
                            </label>
                            <label onClick={this.toggleCamera} className="desktop">
                                <img src="img/scan.svg"/>
                                Scan file
                            </label>
                        </div>
                        { this.state.desktop &&
                            <div id="camera-container" style={{display: this.state.openCamera ? "flex" : "none"}}>
                                <div>
                                    <p>Hold your document in the marked area</p>
                                    <Webcam audio={false} height={"auto"} width={280} ref={this.setRef} screenshotFormat="image/png" width={280}/>
                                    <img src={this.state.base64} alt=""/>
                                    <div className="row">
                                        <button onClick={this.resetImg}><img src="img/reset.svg"/>Reset</button>
                                        <button onClick={this.state.filename === "Image captured" ?  this.toggleCamera : this.capture}><img src="img/scan.svg"/>{this.state.filename === "Image captured" ? "Save" : "Capture"}</button>
                                    </div>
                                    <div id="close" onClick={() => this.cancel()}>Cancel</div>
                                </div>
                            </div> 
                        }
                    </div>
                    {(this.state.uploading) && 
                        <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>}
                </div>
                <div id="footer">
                    <div onClick={() => this.props.changeStep(this.props.isPoi ? 1 : 2)}>Previous Step</div>
                    <button id="submit" onClick={event => this.onSubmit(event)} className={this.state.filename === "" || this.state.uploadFailed || this.state.fileNotSupported ? "disable" : ""} disabled={this.state.filename === "" || this.state.uploadFailed || this.state.fileNotSupported}>Next Step</button>
                </div>
            </div>
        );
    }
}

export default KycUpload;