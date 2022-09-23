import InteractiveShowcase from "./InteractiveShowcase.js";

export default class App
{

	constructor()
	{
		this.componentDidMount();
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

	}

}
new App();