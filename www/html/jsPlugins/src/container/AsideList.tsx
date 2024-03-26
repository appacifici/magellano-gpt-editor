import React 				from 'react';
import Container 			from 'react-bootstrap/Container';
import Navbar 				from 'react-bootstrap/Navbar';
import Image 				from 'react-bootstrap/Image';
import Offcanvas 			from 'react-bootstrap/Offcanvas';
import Link         		from 'next/link';
import styles 				from '../../scss/aside.module.scss'; 
import { Col, Nav, Row } from 'react-bootstrap';
 
function AsideList() {
	const expand = 'lg';
	
	return (
		<>			 
			<aside className='containerStyle rounded mt-4 '>
				<Nav className="pt-1 ps-3 pe-0">
					<Row className={"w-100 "+styles.row}>
						<Col className="mb-2 pb-lg-0 pb-1 border-lg-0 col-12">																					
							<span className={"float-start ms-2 border-lg-0 bg-transparent"}>		
								<Link href={`/classifica/`}>									
									Alert
								</Link>						
							</span>
						</Col>			
					</Row>
				</Nav>		
			</aside>			
		</>
	);
}

export default AsideList;