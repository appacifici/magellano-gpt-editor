import React 				from 'react';
import Container 			from 'react-bootstrap/Container';
import Nav 					from 'react-bootstrap/Nav';
import Navbar 				from 'react-bootstrap/Navbar';
import Badge 				from 'react-bootstrap/Badge';
import Row 					from 'react-bootstrap/Row';
import Col 					from 'react-bootstrap/Col';
import stlHeader      		from '../../scss/header.module.scss';

function Menu() {
	
	return (
		<>
			{['lg'].map((expand) => (
				<Navbar key={expand} expand={expand} className={stlHeader.navtab}>
					<Container fluid="md">												
						<Nav className="justify-content-center flex-grow-1 pe-3">
							<Row>
								{/* <Col className="mb-lg-0 pb-lg-0 border-lg-0 w-25">
									<Badge id="all" onClick={manageClick} role="button" bg={tabStatusMatch === 'all' && primary} className="float-end ms-2 mt-1 w-100">Tutte</Badge>									
								</Col>								 */}
							</Row>
						</Nav>
					</Container>
				</Navbar>
			))}
		</>
	);
}

export default Menu;