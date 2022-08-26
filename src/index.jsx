import { CircularProgress, Pagination } from '@mui/material';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Threetree } from './3dthree';
import './index.css';
import { Physicstree } from './phystree';
import { Snowtree } from './snowtreecomponent';
import { Spheretree } from './spheretree';
import { Ammotree } from './ammotree'
import {
    BrowserRouter,
    Routes,
    Route,
    useNavigate,
    useParams
} from "react-router-dom";

function ContentFromCurrentPage(props) {
    const params = useParams()
    const page = params.idpage ?? 1
    return props.contents[page-1]
}

function Content() {
    
    const navigate = useNavigate()
    const params = useParams()

    const page = params.idpage ?? 1


    const contents = [
        <Snowtree />,
        <Threetree />,
        <Physicstree />,
        <Ammotree />
    ]
    const k = contents[0]
    return <div className="content">
        <Suspense fallback={<CircularProgress />}>
            <Routes>
                <Route path="/page/:idpage" element={<ContentFromCurrentPage contents={contents} />} />
                <Route path="/" element={contents[0]} />
            </Routes>
            <Pagination count={contents.length} defaultPage={page} onChange={(_, v) => navigate('/page/' + v)} />            
        </Suspense>
    </div>;
}


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<BrowserRouter><Content /></BrowserRouter>);
