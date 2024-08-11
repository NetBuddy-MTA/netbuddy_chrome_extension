const onClick = async () => {
  await chrome.storage.local.set({createSelector: true});
  console.log('CreateNewSelectorButton clicked');
  console.log(await chrome.storage.local.get('createSelector'));
};

const button = document.getElementById('CreateNewSelectorButton');
if (button !== null) {
  console.log('CreateNewSelectorButton found on initial search, modifying onclick');
  button.onclick = onClick;
}

const observer = new MutationObserver((mutations) => {
  mutations.filter(mutation => mutation.addedNodes).forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node instanceof HTMLElement && node.id === 'CreateNewSelectorButton') {
        console.log('CreateNewSelectorButton found, modifying onclick');
        node.onclick = onClick;
      }
    });
  });
});

observer.observe(document.body, {childList: true, subtree: true});