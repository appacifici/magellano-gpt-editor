interface ScrapedData {
    bodyContainerHTML:  string;
    h1Content:          string | undefined;
    metaTitle:          string | undefined;
    metaDescription:    string | undefined;
    img:                string | undefined;
}

export {ScrapedData};