import GitHubIcon from '@mui/icons-material/GitHub';
import { AppBar, Button, CircularProgress, Pagination, Toolbar, Typography } from '@mui/material';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import {
    BrowserRouter, Navigate, Route, Routes, useNavigate,
    useParams
} from "react-router-dom";
import { Threetree } from './3dthree';
import { Ammotree } from './ammotree';
import './index.css';
import { Jointstree } from './joints/joints';
import { Physicstree } from './phystree';
import { Roundleavestree } from './roundleaves/roundleaves';
import { Snowtree } from './snowtreecomponent';
import { Spheretree } from './spheretree';
const resumeHtmlUrl = '/resume/fabio-machado-oliveira-resume.pdf'

function PagedContent(props) {
    const params = useParams()
    const navigate = useNavigate()
    const page = parseInt(params.idpage ?? 1)
    return <>
        {props.contents[page - 1]}
        <Pagination count={props.contents.length} defaultPage={page} onChange={(_, v) => navigate(props.urlprefix + v)} />
    </>
}

function routeList(contents, urlprefix) {
    return <Route path={urlprefix}>
        <Route path=":idpage" element={<PagedContent contents={contents} urlprefix={urlprefix} />} />
        <Route index element={<Navigate to={urlprefix + '1'} />} />
    </Route>
}

function Title() {
    const navigate = useNavigate()
    return <>
        <AppBar>
            <Toolbar>
                <Typography variant="h6">
                    Fábio Machado de Oliveira
                </Typography>
                <Button sx={{'marginLeft': '1em'}} variant="contained" href={resumeHtmlUrl}>resume</Button>
                <Button sx={{'marginLeft': '1em'}} variant="contained" href="https://github.com/machado2/fbmac.one#readme">
                    <GitHubIcon />
                </Button>
            </Toolbar>
        </AppBar>
        <Toolbar />
    </>
}

function Content() {

    const params = useParams()

    const contents = [
        <Snowtree />,
        <Threetree />,
        <Physicstree />,
        <Jointstree />,
        <Ammotree />,
        <Spheretree />,
        <Roundleavestree />,
    ]

    const failedExperiments = [
    ]

    return <div className="content">
        <Title />
        <Suspense fallback={<CircularProgress />}>
            <Routes>
                {routeList(contents, "/page/")}
                {routeList(failedExperiments, "/fail/")}
                <Route path="/" element={<Navigate to="/page/3" />} />
            </Routes>
        </Suspense>
    </div>;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<BrowserRouter>
    <Content />
</BrowserRouter>);
