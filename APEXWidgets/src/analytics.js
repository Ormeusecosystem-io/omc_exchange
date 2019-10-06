const getPage = () => {
    return window.location.pathname;
}

export const track = (category, event) => {
    const ga = window.ga;
    event = event || 'click';
    ga('send', 'event', `page: ${getPage().length === 1 ? '/index' : getPage()} - ${category}` , event)
}
