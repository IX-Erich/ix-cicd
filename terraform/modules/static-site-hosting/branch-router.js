function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var indexDocument = '${index_document}';
    var spaMode = ${spa_mode};
    
    // Handle root path for main branch
    if (uri === '/') {
        request.uri = '/' + indexDocument;
        return request;
    }
    
    // Handle feature branch paths like /branch-name or /branch-name/
    var branchMatch = uri.match(/^\/([a-zA-Z0-9-]+)\/?$/);
    if (branchMatch) {
        var branchName = branchMatch[1];
        // Redirect to the branch's index document
        request.uri = '/' + branchName + '/' + indexDocument;
        return request;
    }
    
    // Handle paths within feature branches like /branch-name/style.css
    var branchFileMatch = uri.match(/^\/([a-zA-Z0-9-]+)\/(.+)$/);
    if (branchFileMatch) {
        var branchName = branchFileMatch[1];
        var filePath = branchFileMatch[2];
        
        // If it's a directory-like path without extension, append index document
        if (!filePath.includes('.') && !filePath.endsWith('/')) {
            request.uri = '/' + branchName + '/' + filePath + '/' + indexDocument;
        }
        // Otherwise keep the original path (file exists)
        return request;
    }
    
    // For SPA mode, route 404s to index document
    if (spaMode && !uri.includes('.')) {
        request.uri = '/' + indexDocument;
        return request;
    }
    
    // For all other paths, check if they need index document appended
    if (!uri.includes('.') && !uri.endsWith('/')) {
        request.uri = uri + '/' + indexDocument;
    } else if (uri.endsWith('/')) {
        request.uri = uri + indexDocument;
    }
    
    return request;
}