import React, { useEffect, useState, useCallback }  from 'react';
import axios                                        from 'axios';
import Container                                    from 'react-bootstrap/Container';
import DatePicker                                   from "react-datepicker";
import { Modal, Button, Table, Badge }              from 'react-bootstrap';
import { Spinner }                                  from 'react-bootstrap';
import { AlertArrayWithIdType, AlertWithIdType }    from '../dbService/models/Alert';
import alertStyle      		                        from '../../scss/alert.module.scss';
import "react-datepicker/dist/react-datepicker.css";



interface AlertProps {
    alerts: any; // Sostituisci 'any' con un tipo più specifico per le tue esigenze
}

const AlertComponent: React.FC<AlertProps> = ({ alerts }) => {
    const [show, setShow] = useState(false);
    const [alertData, setAlertData] = useState<any>(null); // Tipo specifico per i dati dell'alert

    const handleClose = () => setShow(false);
    const handleShow  = async (id: string) => {
        try {
            const response = await axios.get(`http://82.55.231.135:3001/api/alerts/${id}`); // Sostituisci con il tuo endpoint corretto
            setAlertData(response.data);
            setShow(true);
        } catch (error) {
            console.error('Errore durante il recupero dei dati dell\'alert:', error);
            // Gestisci l'errore in base alle tue esigenze (mostra un messaggio di errore, ecc.)
        }
    }

    return (
        <>
            <Modal show={show} onHide={handleClose} className={alertStyle.modalwidth80}>
                <Modal.Header closeButton>
                    <Modal.Title>{alertData?.processName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {alertData ? (
                        <div className={alertStyle.dataOverlayAlert}>
                        <div className={alertStyle.infos}>
                          <span><span className={alertStyle.orange}>Origine:</span>&nbsp;&nbsp;{alertData.originSite}</span>
                          <span><span className={alertStyle.orange}>Destinazione:</span>&nbsp;&nbsp;{alertData.destinationSite}</span>
                          <span><span className={alertStyle.orange}>Process ID:</span>&nbsp;&nbsp;{alertData.process}</span>
                          <span><span className={alertStyle.orange}>Name:</span>&nbsp;&nbsp;{alertData.processName}</span>
                          <span><span className={alertStyle.orange}>Data:</span>&nbsp;&nbsp;{new Date(alertData.createdAt).toLocaleString()}</span>
                        </div>
                        {/* <div className="infos">
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Processo</th>
                                <th>Id Processo</th>
                                <th>Inizio (ms)</th>
                                <th>Fine (ms)</th>
                                <th>Durata (ms)</th>
                                <th>Memoria</th>
                                <th>Sezione</th>
                              </tr>
                            </thead>
                            <tbody>
                              {timeTrackers.map((timeTracker, index) => (
                                <tr key={index}>
                                  <td>{timeTracker.processName}</td>
                                  <td>{timeTracker.childProcess}</td>
                                  <td>{timeTracker.startTime}</td>
                                  <td>{timeTracker.endTime}</td>
                                  <td>{timeTracker.duration}</td>
                                  <td>{timeTracker.memory}</td>
                                  <td>{timeTracker.category}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div> */}
                        <Table striped bordered hover>
                          <tbody>
                            <tr>
                              <td>
                                <div className="head">
                                  <Badge bg="success">Chiamata</Badge>
                                </div>
                                <div className="overflow">                                  
                                    {alertData.callData && <pre><div dangerouslySetInnerHTML={{ __html: alertData.callData }} /></pre>}
                                </div>
                              </td>
                              <td>
                                <div className="head">
                                  <Badge bg="success">Risposta</Badge>
                                </div>
                                <div className="overflow">
                                    {alertData.callResponse && <pre><div dangerouslySetInnerHTML={{ __html: alertData.callResponse }}/></pre> }
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <div className="head">
                                  <Badge bg="danger">Error</Badge>
                                </div>
                                <div className="overflow">
                                    {alertData.error && <div dangerouslySetInnerHTML={{ __html: alertData.error }} />}
                                </div>
                              </td>
                              <td>
                                <div className="head">
                                  <Badge bg="info">Alert</Badge>
                                </div>
                                <div className="overflow">
                                    {alertData.alert && <div dangerouslySetInnerHTML={{ __html: alertData.alert }} />}
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={2}>
                                <div className="head">
                                  <Badge bg="success">Debug</Badge>
                                </div>
                                <div className="overflow">
                                  {alertData.debug && <div dangerouslySetInnerHTML={{ __html: alertData.debug }} />}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                        <p>Caricamento...</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Chiudi
                    </Button>
                </Modal.Footer>
            </Modal>
            <Container fluid="md" className={`containerStyle rounded mt-4`}>            
                
                <div className="headingWidget">
                    <i className="fa fa-plus-square-o" aria-hidden="true"></i>
                    <div>
                        <h2>Alert monitoraggio</h2>
                    </div>
                </div>
                <div className="widget widget_Alert">
                    <table className="table footable">
                        <thead>
                            <tr>
                                
                                <th data-class="expand">Date</th>
                                <th data-class="expand">Name</th>
                                <th data-class="expand">Sito Orig.</th>
                                <th data-class="expand">Sito Desc.</th>
                                <th data-class="expand">Chiamata</th>
                                <th data-class="expand">Risposta</th>
                                <th data-class="expand">Error</th>
                                <th data-class="expand">Alert</th>
                                {/* Commentati in quanto marcatori Twig non necessari in React
                                <th data-class="expand">Debug</th>
                                <th data-class="expand">General</th> */}
                                <th data-class="expand">Process</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert: AlertWithIdType) => (
                                <tr onClick={() => handleShow(alert._id)} key={alert._id} className="selectable" data-openoverlay="Alert" data-id={alert._id}>                                    
                                    <td className="important center"><b>{alert.createdAt.toLocaleString()}</b></td>
                                    <td className="important" data-modify="input" data-field="screen">{alert.processName}</td>
                                    <td className="important" data-modify="input" data-field="screen">{alert.originSite}</td>
                                    <td className="important" data-modify="input" data-field="screen">{alert.destinationSite}</td>
                                    <td className="important" data-modify="input" data-field="screen">
                                        {alert.callData ? <Spinner animation="border" variant="secondary" /> : null}
                                    </td>
                                    <td className="important" data-modify="input" data-field="screen">
                                        {alert.callResponse ? <Spinner animation="border" variant="success" /> : null}
                                    </td>
                                    <td className="important">
                                        {alert.error ? <Spinner animation="border" variant="danger" /> : null}
                                    </td>
                                    <td className="important" data-modify="input" data-field="screen">
                                        {alert.alert ? <Spinner animation="border" variant="info" /> : null}
                                    </td>
                                    <td className="important">{alert.process}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Container>
        </>
    );
}

export default AlertComponent;