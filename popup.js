document.getElementById('generateICS').addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTab = tabs[0];
    chrome.scripting.executeScript({
      target: {tabId: activeTab.id},
      files: ['content.js']
    }, () => {
      chrome.tabs.sendMessage(activeTab.id, {action: "scrapePage"}, response => {
          const icsContent = response.icsContent;
          // console.log(icsContent);
          scrapeAndGenerateICS(icsContent);
      });
    });
  });
});

function scrapeAndGenerateICS(icsContent) {
  // create and download the .ics file
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'bu_calendar.ics';

  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
}
