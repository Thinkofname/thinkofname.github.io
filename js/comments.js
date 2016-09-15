
window.onload = function() {
	var comments = localStorage.getItem("gh-" + githubIssueID);
	if (comments != null) {
		var info = JSON.parse(comments);
		var now = Date.now();
		if (now - info.fetchTime >= 20 * 60 * 1000) {
		localStorage.removeItem("gh-" + githubIssueID);
		}
	}
	if (comments == null) {
		var url = "https://api.github.com/repos/thinkofname/thinkofname.github.io/issues/" + githubIssueID + "/comments?per_page=100";
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				var info = {
					fetchTime: Date.now(),
					comments: JSON.parse(xhr.responseText),
				};
				localStorage.setItem("gh-" + githubIssueID, JSON.stringify(info));
				renderComments();
			}
		};
		xhr.open("GET", url, true);
		xhr.setRequestHeader("Accept", "application/vnd.github.full+json");
		xhr.send(null);
	} else {
		renderComments();
	}
}

function renderComments() {
	var comments = localStorage.getItem("gh-" + githubIssueID);
	var info = JSON.parse(comments);
	var data = info.comments;
	var area = document.getElementById("comments");
	for (var i = 0; i < data.length; i++) {
		var msg = data[i];
		var comment_url = msg.html_url;
		var name = msg.user.login;
		var name_url = msg.user.html_url;
		var icon = msg.user.avatar_url + "&size=32";
		var body = msg.body_html;

		area.insertAdjacentHTML("beforeend",
			"<div class='comment'>"
				+ "<a href='" + name_url + "'>"
				+ "<img src='" + icon + "' class='comment-icon' align='left'/></a>"
				+ "<a href='" + comment_url + "'>" + name + "</a><br/>"
				+ body
				+ "</div><br/>"
		);
	}
}