use oca_ast_semantics::ast::OCAAst;
use oca_bundle_semantics::build::from_ast;
use said::{derivation::HashFunctionCode, sad::SerializationFormats, version::Encode};

#[derive(thiserror::Error, Debug, serde::Serialize)]
#[serde(untagged)]
pub enum ValidationError {
    #[error(transparent)]
    OCAFileParse(#[from] oca_file::ocafile::error::ParseError),
}

// parse the oca file
pub fn parse_ocafile(ocafile: String) -> Result<OCAAst, Vec<ValidationError>> {
    oca_file_semantics::ocafile::parse_from_string(ocafile).map_err(|e| {
        vec![ValidationError::OCAFileParse(
            oca_file::ocafile::error::ParseError::SemanticsError(e),
        )]
    })
}

pub fn build_bundle(oca_ast: OCAAst) -> String {
    let build_result = from_ast(None, &oca_ast);
    match build_result {
        Ok(oca_build) => {
            let code = HashFunctionCode::Blake3_256;
            let format = SerializationFormats::JSON;
            let oca_bundle_encoded = oca_build.oca_bundle.encode(&code, &format).unwrap();
            let oca_bundle_json = String::from_utf8(oca_bundle_encoded).unwrap();
            oca_bundle_json
        }
        Err(e) => {
            println!("{:?}", e);
            String::new()
        }
    }
}
