import React, { Component } from "react";
import Quagga from "@ericblade/quagga2";
interface ScannerProps {
  onDetected: (result: any) => void;
  setScanning: (scanning: boolean) => void;
}

interface ScannerState {
  facingMode: string;
  isHidden: boolean;
}

class Scanner extends Component<ScannerProps, ScannerState> {
  state: ScannerState = {
    facingMode: "environment",
    isHidden: false,
  };

  handleClick = () => {
    const { facingMode } = this.state;
    const newFacingMode = facingMode === "environment" ? "environment" : "user";
    this.setState({ facingMode: newFacingMode });

    const width = window.innerWidth;
    const height = window.innerHeight;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          constraints: {
            width,
            height,
            aspectRatio: { ideal: height / width },
            facingMode: newFacingMode,
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            "ean_reader",
            "code_39_reader",
            "code_128_reader",
            "i2of5_reader",
          ],
        },
        locate: true,
      },
      (err: any) => {
        if (err) {
          return console.log(err);
        }
        Quagga.start();
      }
    );
  };

  updateVideoSize() {
    const video = document.querySelector("video");
    if (video) {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const windowAspectRatio = window.innerWidth / window.innerHeight;

      if (aspectRatio > windowAspectRatio) {
        video.style.width = "100%";
        video.style.height = "auto";
      } else {
        video.style.width = "auto";
        video.style.height = "100%";
      }
    }
  }

  componentDidMount() {
    const { facingMode } = this.state;
    console.log(facingMode);
    this.handleClick();
    Quagga.onDetected(this._onDetected);
    this.updateVideoSize();
    window.addEventListener("resize", this.updateVideoSize);
  }

  componentWillUnmount() {
    Quagga.offDetected(this._onDetected);
    window.removeEventListener("resize", this.updateVideoSize);
  }

  _onDetected = (result: any) => {
    const { onDetected } = this.props;
    onDetected(result);
    Quagga.stop();
  };

  _onClose = () => {
    const { isHidden } = this.state;
    this.setState({ isHidden: !isHidden });
    const { setScanning } = this.props;
    setScanning(false);
    Quagga.stop();
  };

  render() {
    const { isHidden } = this.state;

    const vid: React.CSSProperties = {
      position: "fixed",
      zIndex: 999,
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };

    return (
      !isHidden && (
        <>
          <div id="controls">
            <span id="close">
              <div className="flex-container">
                <div className="flex-item">
                  <span
                    id="closebtn"
                    className="icon-left-open"
                    onClick={this._onClose}
                  ></span>
                </div>

                <div className="flex-item">
                  <span
                    id="switch-camera"
                    className="icon-flipcamera"
                    onClick={this.handleClick}
                  ></span>
                </div>
              </div>
            </span>
          </div>
          <div id="interactive" className="viewport" style={vid}></div>
        </>
      )
    );
  }
}

interface ResultProps {
  result: any;
}

class Result extends Component<ResultProps> {
  render() {
    const { result } = this.props;
    if (!result) {
      return null;
    }
    return result.codeResult.code;
  }
}

interface ScanProps {
  onDetected: (barcode: string) => void;
  handleSubmit: (barcode: string, obj: object) => void;
}

interface ScanState {
  scanning: boolean;
  results: any[];
  codeResult: string;
}

class Scan extends React.Component<ScanProps, ScanState> {
  state: ScanState = {
    scanning: false,
    results: [],
    codeResult: "",
  };

  _scan = () => {
    this.setState({ scanning: true });
  };

  _onDetected = (result: any) => {
    const { onDetected, handleSubmit } = this.props;
    const { results } = this.state;
    const newResults = [...results, result];
    const codeResult = result.codeResult.code;
    this.setState({ results: newResults, codeResult, scanning: false });
    onDetected(codeResult);
    Quagga.stop();
    handleSubmit(codeResult, {});
  };

  render() {
    const { scanning } = this.state;
    return (
      <>
        <button
          type="button"
          aria-label="Barcode scannen"
          role="button"
          tabIndex={0}
          onClick={this._scan}
        >
          <span className="icon-barcode" />
        </button>
        {scanning ? (
          <Scanner
            onDetected={this._onDetected}
            setScanning={(scanning) => this.setState({ scanning })}
          />
        ) : null}
      </>
    );
  }
}

export default Scan;
