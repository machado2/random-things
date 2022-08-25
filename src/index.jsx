import { Pagination } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Threetree } from './3dthree';
import './index.css';
import { Physicstree } from './phystree';
import { Snowtree } from './snowtreecomponent';
import { Spheretree } from './spheretree';

function Content() {
    const [page, setPage] = React.useState(1);
    const handleChange = (event, value) => {
        setPage(value);
    };
    let content;
    switch (page) {
        case 1:
            content = <Snowtree />;
            break;
        case 2:
            content = <Threetree />;
            break;
        case 3:
            content = <Physicstree />;
            break;
    }
    return <div className="content">
        {content}
        <Pagination count={3} page={page} onChange={handleChange} />
    </div>;
}


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Content />);
