import React, {useEffect, useState, useCallback}        from 'react';
import { useRouter }                                    from 'next/router';
import format                                           from 'date-fns/format';
import moment                                           from 'moment';
import Container                                        from 'react-bootstrap/Container';
import DatePicker                                       from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AlertArrayWithIdType, AlertWithIdType } from '../dbService/models/Alert';
import { Spinner } from 'react-bootstrap';


interface AlertProps {
    alerts: any; // Sostituisci 'any' con un tipo più specifico per le tue esigenze
}

const AlertComponent: React.FC<AlertProps> = ({ alerts }) => { 
    const router            = useRouter();

    return( 
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
                    <th className="center" data-hide="phone"></th>
                    <th data-class="expand">Date</th>
                    <th data-class="expand">Name</th>
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
                    {alerts.map((alert:AlertWithIdType) => (
                    <tr key={alert._id} className="selectable" data-openoverlay="Alert" data-id={alert._id}>
                        <td className="important center"><span className="badge">{alert._id}</span></td>
                        <td className="important center"><b>{new Date(alert.createdAt).toLocaleString()}</b></td>
                        <td className="important" data-modify="input" data-field="screen">{alert.processName}</td>
                        <td className="important" data-modify="input" data-field="screen">
                        {alert.callData ? <Spinner animation="border" variant="secondary" /> : null}
                        </td>
                        <td className="important" data-modify="input" data-field="screen">
                        {alert.callResponse ? <Spinner animation="border" variant="success" /> : null}
                        </td>
                        <td className="important">
                        {alert.error ?  <Spinner animation="border" variant="danger" />: null}
                        </td>
                        <td className="important" data-modify="input" data-field="screen">
                        {alert.alert ?  <Spinner animation="border" variant="info" />: null}
                        </td>
                        <td className="important">{alert.process}</td>
                    </tr>
                    ))}
                </tbody>
                </table>                
            </div>
        </Container>        
    ); 
}

export default AlertComponent;