import React from "react";
import "./app.css";
import InteractiveShowcase from "./InteractiveShowcase.js";

export default class App extends React.Component
{

	constructor(props)
	{
		super(props);
	}

	componentDidMount()
	{
		if (!InteractiveShowcase.initialized)
		{
			document.addEventListener("interactive_showcase_init", () =>
			{
				const preloader_screen = document.getElementById("custom_preloader");

				preloader_screen.addEventListener("transitionend", () =>
				{
					preloader_screen.remove();
				});

				preloader_screen.style.opacity = "0";
			});

			new InteractiveShowcase();
		}
	}

	render()
	{
		return (
			/*<iframe id="mp_iframe" src="/showcase-bundle/showcase.html?m=c9asaniBL2y&play=1&hl=2&qs=1&mls=2&mt=0&lang=en&search=0&applicationKey=cndc87emabqqnhsznei17444c" allowFullScreen allowvr="yes"></iframe>*/

			<div>

				<iframe id="mp_iframe" src="/showcase-bundle/showcase.html?m=c9asaniBL2y&play=1&hl=2&qs=1&mt=0&applicationKey=cndc87emabqqnhsznei17444c" allowFullScreen allowvr="yes"></iframe>

				<div	id="custom_preloader"></div>

			</div>

		);
	}

}