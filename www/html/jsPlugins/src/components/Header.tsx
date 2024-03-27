import React            from 'react';
import Menu             from './Menu';
import Image            from 'react-bootstrap/Image';
import Link         	from 'next/link';
import headerStyle      from '../../scss/header.module.scss';

function Header() {
    return( 
        <>
            <header>
                <div className={headerStyle.topBar}>
                    <Link href='/'>
                        <Image src="/images/diretta-orizzontale.svg" rounded />
                    </Link>
                </div>                
            </header>
        </>
    );
}
export default Header;