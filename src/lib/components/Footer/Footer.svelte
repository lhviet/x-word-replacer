<script lang="ts">
	import { searchConfigState } from '$lib/stores';
	import { Separator } from '$lib/components/ui/separator';
</script>

<footer class="relative">
	<Separator class="bg-slate-300" />
	<div class="py-1 px-2">
		<table>
			<tbody>
			<tr>
				<td style="width: 190px;">
					<table>
						<tbody>
						<tr>
							<td>
								<input id='idIsMatchCase' type='checkbox' class='mr-2' bind:checked={$searchConfigState.matchCase} />
							</td>
							<td>
								<label for='idIsMatchCase'>Match Case (regex /i)</label>
							</td>
						</tr>
						<tr>
							<td>
								<input id='idIsRegexUsing' type='checkbox' class='mr-2' bind:checked={$searchConfigState.regex} />
							</td>
							<td>
								<label for='idIsRegexUsing'>
									<a class="text-blue-700 underline" target="_blank" href="https://viet.pughtml.com/posts/post-7-x-word-replacer-multi-highlight-with-regex">Use Regular Expression</a>
								</label>
							</td>
						</tr>
						<tr>
							<td>
								<input id='idIsTextInputFields' type='checkbox' class='mr-2' bind:checked={$searchConfigState.textInputFields} />
							</td>
							<td>
								<label for='idIsTextInputFields'>Input/TextArea</label>
							</td>
						</tr>
						<tr>
							<td>
								<input id='idIsWebpage' type='checkbox' class='mr-2' bind:checked={$searchConfigState.webpage} />
							</td>
							<td>
								<label for='idIsWebpage'>Web page</label>
							</td>
						</tr>
						</tbody>
					</table>
				</td>
				<td style='text-align:center;'><h4>Help maintaining this app</h4>
					<form class='form-donate' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_blank'
								style='display:inline-table;'>
						<input type='hidden' name='cmd' value='_s-xclick' />
						<input type='hidden'
									 name='hosted_button_id'
									 value='XR358N3E9F5MN' />
						<input
							type='image' src='https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif' name='submit'
							alt='PayPal - The safer, easier way to pay online!' />
						<img alt='' border='0'
								 src='https://www.paypalobjects.com/en_US/i/scr/pixel.gif'
								 width='1' height='1' />
					</form>
					<table style="text-align: left">
						<tbody>
						<tr>
							<td>
								<input id='idIsHTML' type='checkbox' class='mr-2' bind:checked={$searchConfigState.html} />
							</td>
							<td>
								<label for='idIsHTML'>Raw HTML <i>(modify html may break your page)</i></label>
							</td>
						</tr>
						</tbody>
					</table>
				</td>
			</tr>
			</tbody>
		</table>
	</div>
</footer>

<style lang="scss">
  footer {
		margin-top: .5rem;

    label {
      font-size: .9rem;
      font-weight: 300;
      color: #636363;
    }

    h4 {
      margin-top: 0;
      margin-bottom: .5rem;
    }

    i {
      font-size: .8rem
    }
  }

  .form-donate {
    display: inline-table;
    vertical-align: middle;
    margin: 0;
    padding: 0;
  }
</style>