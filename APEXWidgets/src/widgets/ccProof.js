/* global AlphaPoint, document, localStorage, APConfig */
import React from 'react';
import axios from '../axios';
import Webcam from 'react-webcam';
import { MoonLoader } from "react-spinners";
import DocumentTooltip from './documentTooltip';
import {checkErrorCode} from './helper';

class ProofOfIdentity extends React.Component {
  
    constructor(props) {
        super(props);
        this.state = {
            cc_front: "",
            cc_back: '',
            base64Front: null,
            base64Back: null,
            openCameraFront: false,
            openCameraBack: false,
            desktop: null,
            fileFront: null,
            fileFrontEmpty: "",
            fileBack: null,
            fileBackEmpty: "",
            select: true,
            uploading: false,
            uploaded: false,
            uploadFailed: false,
            fileNotSupportedFront: false,
            fileNotSupportedBack: false,
            fileNotSupportedErr: "",
            maxUploadDocuments: false,
            maxUploadDocumentsErr: "",
            fileSrcFront: "",
            fileSrcBack: ""
        }
    }

    getFormData(side){
        let formData = new FormData();
        formData.append("cardSide",`cc_${side}`);
        if(side === "front"){
            formData.append("cardFile", this.state.base64Front !== null ? this.state.base64Front : this.state.fileFront);    
            return formData
        }
        formData.append("cardFile", this.state.base64Back !== null ? this.state.base64Back : this.state.fileBack);
        return formData
    }
    
    sendDocument = (data) => axios.put(`/cps/document/card` , data)

    toggleCamera(side){
        side === 'front' ? this.setState({...this.state, openCameraFront: !this.state.openCameraFront}) : this.setState({...this.state, openCameraBack: !this.state.openCameraBack});
    }

    getBase64(file){
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
    }

    onChange(e, side){
        e.persist();
        const file = e.target.files[0]
        if(file && this.validateFileUpload(file, side)){
            this.getBase64(e.target.files[0]).then(basedFile => {
                side === 'Front' 
                    ? this.setState({...this.state, fileFront: file, cc_front: file.name, fileNotSupportedFront: false, base64Front: null, fileSrcFront: basedFile})
                    : this.setState({...this.state, fileBack: file, cc_back: file.name, fileNotSupportedBack: false, base64Back: null, fileSrcBack: basedFile})
            }).catch(e => console.log(e))
        }
        document.getElementById('inputFile'+side).removeAttribute('capture');
    }

    validateFileUpload(file, side) {
        let filename = file.name,
            filesize = file.size,
            filetype = file.type 
            filesize = filesize/1024/1024 < 5.1

        if (filesize && filetype == "image/png" || filesize && filetype == "image/jpeg" || filesize && filetype == "image/jpg" || filesize && filetype == "application/pdf"  ) {               
            return true 
        } 

        let errMsg = filesize ? "Document only allowed file types of PDF, PNG and JPG." : "Document size limit to 5MB";
        side === 'Front' 
        ? this.setState({fileNotSupportedErr: errMsg, fileNotSupportedFront: true})
        : this.setState({fileNotSupportedErr: errMsg, fileNotSupportedBack: true})
        return false        
    }

    componentDidMount(){
        // console.log(window.innerWidth > 768)
        this.setState({ ...this.state, desktop: window.innerWidth > 768 })
    }

    setRef = webcam => this.webcam = webcam;

    capture = (e, side) => {
        if(side === 'cc_front'){
            const base64Front = this.webcam.getScreenshot();
            if(base64Front){
                this.setState({...this.state, base64Front, [side]: side});
            }
        }
        else{
            const base64Back = this.webcam.getScreenshot();
            if(base64Back){
                this.setState({...this.state, base64Back, [side]: side});
            }
        }
        
    }

    resetImg = (e, side) => {
        let state = {};
        if(side === "cc_front"){
            state.base64Front = ""
        }
        else{
            state.base64Back = ""
        }
        this.setState({...this.state, ...state, [side]: ""});
    }

    mobileCamera = (side) => {
        document.getElementById('inputFile'+side).setAttribute('capture', 'camera');
        document.getElementById('inputFile'+side).click();
        document.getElementById('inputFile'+side).removeAttribute('capture');
    }

    async onSubmit(){
        let state = {};
        let allowed = true;
        if(!this.state.fileFront && !this.state.base64Front){
            state = {fileFrontEmpty: "Please upload 2 sides of your credit card"};
            allowed = false;
        }
        if(!this.state.fileBack && !this.state.base64Back){
            state = {...state, fileBackEmpty: "Please upload 2 sides of your credit card"};
            allowed = false;
        }
        this.setState({...this.state, ...state})

        if(allowed){
            try{
                
                const resFront = await this.sendDocument(this.getFormData('front'))
                if(resFront.data.code === 201){
                    try{
                        const resBack = await this.sendDocument(this.getFormData('back'))
                        if(resBack.data.code === 201){
                            axios.put(`/cps/document/card/uploadApprove` ).then(res => {
                                this.props.changeStep(5)
                            })
                        }
                    }catch(err){
                        checkErrorCode(err)
                    }
                }
            }catch(err){
                checkErrorCode(err)
            }
        }
        

    }

    cancel(side){
        if(side === "Front"){
            return this.setState({...this.state, [`openCamera${side}`]: false, [`base64${side}`]: "", cc_front: ""})
        }
        return this.setState({...this.state, [`openCamera${side}`]: false, [`base64${side}`]: "", cc_back: ""})
    }
   

    isDisabled(){
        return this.state.fileNotSupportedFront || this.state.fileNotSupportedBack || this.state.uploadFailed || 
                (!this.state.fileFront && !this.state.base64Front && !this.state.fileBack && !this.state.base64Back)
    }
  render() {
    return (
        <div className="poi-container">
            <h2>Provide proof of your payment method</h2>
            <h3>Please upload or scan a copy of your Credit card’s front and back</h3>
            {(this.state.uploadFailed) && 
                <div id="tooltip">
                    {this.state.maxUploadDocuments && <div>{this.state.maxUploadDocumentsErr}</div>}
                    <div>Upload failed.</div>
                </div>
            }
            <div className="inner-container">
                <div className="document">
                    <DocumentTooltip title="Credit card-front" content="just text"/>
                    <div className="document-holder">
                        {
                            !this.state.base64Front && !this.state.fileSrcFront
                            ?
                            <div className="no-file">
                                <img src="img/upload-big.svg"/>
                                <span>No file selected</span>
                            </div>
                            :
                            <img src={this.state.base64Front ? this.state.base64Front : this.state.fileSrcFront}/>
                        }
                    </div>
                    {this.state.fileFrontEmpty !== '' && <p style={{color: "salmon", fontSize: "12px", fontWeight: "500"}}>{this.state.fileFrontEmpty}</p>}
                    {this.state.fileNotSupportedFront && <p style={{color: "salmon", fontSize: "12px", fontWeight: "500"}}>{this.state.fileNotSupportedErr}</p>}
                </div>
                <div className="buttons" style={{marginTop: "40px"}}>
                    <label htmlFor="inputFileFront">
                        <img src="img/uploadf.svg"/>
                        {this.state.fileSrcFront === "" ? "Upload file" : "Change file" }
                        <input id="inputFileFront" name="front" onChange={e => this.onChange(e, 'Front')} type="file" accept="image/* " style={{display: "none"}}/>
                    </label>
                    <span>or</span>
                    <label onClick={() => this.mobileCamera('Front')} className="mobile">
                        <img src="img/scan.svg"/>
                        Scan file
                    </label>
                    <label onClick={() => this.toggleCamera('front')} className="desktop">
                        <img src="img/scan.svg"/>
                        Scan file
                    </label>

                </div>
            </div>
            <div className="inner-container">
                <div className="document">
                    <DocumentTooltip title={"Credit card-back"} content="just text"/>
                    <div className="document-holder">
                        {
                            this.state.cc_back === ""
                            ?
                            <div className="no-file">
                                <img src="img/upload-big.svg"/>
                                <span>No file selected</span>
                            </div>
                            :
                            <img src={this.state.base64Back ? this.state.base64Back : this.state.fileSrcBack}/>
                        }
                    </div>
                    {this.state.fileNotSupportedBack && <p style={{color: "salmon", fontSize: "12px", fontWeight: "500"}}>{this.state.fileNotSupportedErr}</p>}
                    {this.state.fileBackEmpty !== '' && <p style={{color: "salmon", fontSize: "12px", fontWeight: "500"}}>{this.state.fileBackEmpty}</p>}
                    <div className="supported" style={{marginTop: "17px"}}>Supported formats: <span>JPG, PNG, PDF</span></div>
                    <div className="supported">Maximum file size: <span>5 MB</span></div>
                </div>
                <div className="buttons">
                    <label htmlFor="inputFileBack">
                        <img src="img/uploadf.svg"/>
                        {this.state.fileSrcBack === "" ? "Upload file" : "Change file" }
                        <input id="inputFileBack" name="back" onChange={e => this.onChange(e, 'Back')} type="file" accept="image/*;" style={{display: "none"}}/>
                    </label>
                    <span>or</span>
                    <label onClick={() => this.mobileCamera('Back')} className="mobile">
                        <img src="img/scan.svg"/>
                        Scan file
                    </label>
                    <label onClick={() => this.toggleCamera('back')} className="desktop">
                        <img src="img/scan.svg"/>
                        Scan file
                    </label>
                </div>
        
            </div>
            { this.state.desktop &&
                <div id="camera-container" style={{display: this.state.openCameraFront || this.state.openCameraBack ? "flex" : "none"}}>
                    <div>
                        <p>Hold your document in the marked area</p>
                        <Webcam audio={false} height={"auto"} width={280} ref={this.setRef} screenshotFormat="image/png" width={280}/>
                        <img src={this.state.openCameraFront ? this.state.base64Front : this.state.base64Back} alt=""/>
                        <div className="row">
                            <button onClick={(e) => this.resetImg(e, this.state.openCameraFront ? 'cc_front' : 'cc_back')}><img src="img/reset.svg"/>Reset</button>
                            <button onClick={(e) => (this.state.openCameraFront && this.state.base64Front) || (this.state.openCameraBack && this.state.base64Back) ?  this.toggleCamera(this.state.openCameraFront ? 'front' : 'back') : this.capture(e, this.state.openCameraFront ? 'cc_front' : 'cc_back')}><img src="img/scan.svg"/>{((this.state.base64Front && this.state.openCameraFront) || (this.state.base64Back && this.state.openCameraBack)) ? "Save" : "Capture"}</button>
                        </div>
                        <div id="close" onClick={() => this.cancel(this.state.openCameraFront ? 'Front' : 'Back')}>Cancel</div>
                    </div>
                </div> 
            }
            {(this.state.uploading) && 
                <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>}
            <div id="footer">
                <div onClick={() => this.props.changeStep(3)}>Previous Step</div>
                <button id="submit" onClick={event => this.onSubmit(event)} className={this.isDisabled() ? "disable" : ""} disabled={this.isDisabled()}>Next Step</button>
            </div>
        </div>
    );
  }
}

export default ProofOfIdentity;