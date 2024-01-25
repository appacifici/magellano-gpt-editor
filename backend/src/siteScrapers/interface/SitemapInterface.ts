interface SitemapNode {    
    loc:        string;
    lastmod:    string;
}

type ReadSitemapSingleNodeResponse = {
    success:    boolean;
    data?:      SitemapNode;
    error?:     string;
};


type UrlNode = {
    loc:        string;
    lastmod:    string;
};

type ReadSitemapResponse = {
    success:    boolean;
    data?:      UrlNode[];
    error?:     string;
};

export type {ReadSitemapSingleNodeResponse,ReadSitemapResponse,UrlNode};