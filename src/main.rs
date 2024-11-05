mod parser;
use clap::{Arg, Command};
use std::fs;

fn main() {
    let matches = Command::new("oca")
        .version("0.1.0")
        .author("ADC")
        .about("OCA file parser")
        .arg(
            Arg::new("ocafile")
                .short('O')
                .long("ocafile")
                .value_name("OCAFILE")
                .help("Sets the input ocafile to use")
                .num_args(1),
        )
        .get_matches();

    let ocafile = matches
        .get_one::<String>("ocafile")
        .expect("ocafile argument is required");
    let unparsed_file = fs::read_to_string(ocafile).expect("Could not read ocafile");

    let oca_ast_result = parser::parse_ocafile(unparsed_file);
    let oca_bundle = match oca_ast_result {
        Ok(oca_ast) => parser::build_bundle(oca_ast),
        Err(errors) => {
            for error in errors {
                eprintln!("Error: {:?}", error);
            }
            return;
        }
    };

    println!("{}", oca_bundle);
}


