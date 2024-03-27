import React        from 'react';
import Container    from 'react-bootstrap/Container';
import Row          from 'react-bootstrap/Row';
import Col          from 'react-bootstrap/Col';
import AsideList    from './AsideList';

interface MainProps {
    MainPage: React.ReactNode;
    mainPageProps?: any; // Idealmente, definisci un tipo più specifico anziché 'any'
}

const Main: React.FC<MainProps> = ({ MainPage }) => {
    return( 
        <Container>  
            <Row>
                <Col xs={6} lg={2}>
                    <AsideList/>
                </Col>
                <Col xs={12} lg={10} className="p-1">
                    {MainPage}
                </Col>                
            </Row>        
        </Container>
    );
}

export default Main;